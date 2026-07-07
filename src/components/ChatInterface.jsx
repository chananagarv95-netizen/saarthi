import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReasoningUI from './ReasoningUI';
import DynamicInputBar from './DynamicInputBar';
import WidgetRegistry from './widgets/WidgetRegistry';
import { User, ShieldCheck } from 'lucide-react';
import { chatApi } from '../services/api';
import { storage } from '../services/storage';
import './ChatInterface.css';

const REASONING_STEPS = [
  'Understanding your request...',
  'Finding official services...',
  'Checking eligibility...',
  'Preparing your workflow...'
];

const ChatInterface = ({ initialMessage, onUploadClick, restoredChat }) => {
  const [messages, setMessages] = useState([]);
  const [isReasoning, setIsReasoning] = useState(false);
  const [pendingIntent, setPendingIntent] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);
  const processedRef = useRef(false);

  // Restore from history
  useEffect(() => {
    if (restoredChat) {
      setMessages(restoredChat.messages || []);
      setSessionId(restoredChat.sessionId);
      processedRef.current = true;
    }
  }, [restoredChat]);

  // Handle initial message from home
  useEffect(() => {
    if (initialMessage && !processedRef.current) {
      processedRef.current = true;
      handleUserMessage(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isReasoning]);

  const handleUserMessage = async (text) => {
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsReasoning(true);

    try {
      const data = await chatApi.send(text, sessionId);
      setPendingIntent(data);
      if (!sessionId) setSessionId(data.sessionId);
    } catch (error) {
      setIsReasoning(false);
      const errMsg = { role: 'system', content: "I'm having trouble reaching the servers right now. Please check your connection and try again." };
      setMessages(prev => [...prev, errMsg]);
    }
  };

  const handleReasoningComplete = () => {
    setIsReasoning(false);
    if (pendingIntent) {
      const sysMsg = {
        role: 'system',
        content: pendingIntent.reply,
        workflow: pendingIntent.workflow,
        metadata: pendingIntent
      };
      setMessages(prev => {
        const updated = [...prev, sysMsg];
        // Persist to localStorage
        const sid = pendingIntent.sessionId || sessionId;
        if (sid) {
          const chatRecord = { sessionId: sid, title: updated[0]?.content?.slice(0, 60) || 'Conversation', messages: updated, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
          storage.saveChat(chatRecord);
        }
        return updated;
      });
      setPendingIntent(null);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-history" ref={scrollRef}>
        {messages.length === 0 && !isReasoning && (
          <div className="chat-empty">
            <ShieldCheck size={32} strokeWidth={1.5} />
            <p>Ask SAARTHI about any government service</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.role}`}>
            {msg.role === 'user' && <div className="chat-avatar user-avatar"><User size={16} /></div>}
            {msg.role === 'system' && <div className="chat-avatar system-avatar"><ShieldCheck size={16} strokeWidth={2.5} /></div>}
            <div className="chat-content">
              <span>{msg.content}</span>
              {msg.workflow && <WidgetRegistry workflow={msg.workflow} metadata={msg.metadata} />}
            </div>
          </div>
        ))}
        {isReasoning && (
          <div className="chat-bubble system">
            <div className="chat-avatar system-avatar"><ShieldCheck size={16} strokeWidth={2.5} /></div>
            <div className="chat-content">
              <ReasoningUI steps={REASONING_STEPS} onComplete={handleReasoningComplete} />
            </div>
          </div>
        )}
      </div>
      <div className="chat-input-wrapper">
        <DynamicInputBar onSubmit={handleUserMessage} autoFocus={true} onUploadClick={onUploadClick} />
      </div>
    </div>
  );
};

export default ChatInterface;
