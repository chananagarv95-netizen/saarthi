import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, MessageSquare, ChevronRight } from 'lucide-react';
import { storage } from '../services/storage';
import './HistoryPage.css';

const HistoryPage = ({ onRestoreChat }) => {
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setChats(storage.getChats());
  }, []);

  const handleDelete = (e, sessionId) => {
    e.stopPropagation();
    storage.deleteChat(sessionId);
    setChats(prev => prev.filter(c => c.sessionId !== sessionId));
  };

  const handleRestore = (chat) => {
    if (onRestoreChat) onRestoreChat(chat);
    navigate('/chat');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Conversation History</h1>
        <p className="page-subtitle">All your previous citizen service interactions</p>
      </div>

      {chats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>No conversations yet</h3>
          <p>Your chat history will appear here once you start a conversation.</p>
          <button className="cta-btn" onClick={() => navigate('/')}>Start a Conversation</button>
        </div>
      ) : (
        <div className="history-list">
          {chats.map(chat => (
            <div key={chat.sessionId} className="history-item" onClick={() => handleRestore(chat)}>
              <div className="history-icon">
                <MessageSquare size={20} />
              </div>
              <div className="history-body">
                <h4 className="history-title">{chat.title || 'Untitled conversation'}</h4>
                <div className="history-meta">
                  <Clock size={12} />
                  <span>{new Date(chat.updatedAt || chat.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span>·</span>
                  <span>{chat.messages?.length || 0} messages</span>
                </div>
              </div>
              <div className="history-actions">
                <button className="icon-action-btn delete" onClick={e => handleDelete(e, chat.sessionId)} title="Delete conversation">
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={18} className="history-arrow" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
