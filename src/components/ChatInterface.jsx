import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import { User, ShieldCheck, Volume2, Square, Copy, Check, RotateCcw, FileText } from 'lucide-react';
import ReasoningUI from './ReasoningUI';
import DynamicInputBar from './DynamicInputBar';
import ServiceCard from './ServiceCard';
import DocumentResult from './DocumentResult';
import { api } from '../services/api';
import { storage, speechLang } from '../services/storage';
import './ChatInterface.css';

const Hero3D = lazy(() => import('./Hero3D'));

const CHAT_STEPS = ['Understanding your request…', 'Finding the right department…', 'Checking official sources…', 'Preparing your answer…'];
const DOC_STEPS = ['Uploading securely…', 'Reading the document…', 'Extracting key details…', 'Checking for issues…'];
const STARTERS = ['I lost my Aadhaar card', 'Someone cheated me on UPI', 'How do I get an income certificate?', 'मुझे पेंशन के लिए आवेदन करना है'];

const newId = () => crypto.randomUUID();

// Render URLs as links; everything else stays plain text (no HTML injection).
const Linkified = ({ text }) => String(text).split(/(https?:\/\/[^\s)]+)/g).map((part, i) => (
  /^https?:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part.replace(/^https?:\/\/(www\.)?/, '')}</a> : part
));

const MessageTools = ({ text }) => {
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => () => { if (canSpeak) window.speechSynthesis.cancel(); }, [canSpeak]);

  const speak = () => {
    const synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang(storage.getProfile().language);
    u.voice = synth.getVoices().find((v) => v.lang === u.lang) || null;
    u.rate = 0.95;
    u.onend = u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };

  return (
    <div className="msg-tools">
      {canSpeak && <button type="button" onClick={speak} aria-label={speaking ? 'Stop reading' : 'Read aloud'} title={speaking ? 'Stop' : 'Read aloud'}>{speaking ? <Square size={14} /> : <Volume2 size={14} />}</button>}
      <button type="button" onClick={copy} aria-label="Copy answer" title="Copy">{copied ? <Check size={14} /> : <Copy size={14} />}</button>
    </div>
  );
};

const ChatInterface = ({ seed }) => {
  const [messages, setMessages] = useState(seed.messages || []);
  const [pending, setPending] = useState(null); // null | 'chat' | 'doc'
  const scrollRef = useRef(null);
  const createdAt = useRef(seed.createdAt || new Date().toISOString());
  const startedRef = useRef(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Persist after every change (only serialisable fields).
  useEffect(() => {
    if (!messages.length) return;
    const clean = messages.filter((m) => !m.error).map(({ retry, ...m }) => m); // eslint-disable-line no-unused-vars
    if (!clean.length) return;
    storage.saveChat({ id: seed.id, title: clean.find((m) => m.role === 'user')?.content.slice(0, 70) || 'Conversation', messages: clean, createdAt: createdAt.current, updatedAt: new Date().toISOString() });
  }, [messages, seed.id]);

  // New answers scroll to their first line (people read top-down); everything else to the bottom.
  useEffect(() => {
    const box = scrollRef.current;
    const last = box?.querySelector('.chat-bubble:last-child');
    if (!box || !last) return;
    if (!pending && last.classList.contains('system')) last.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  const sendText = useCallback(async (text, { echo = true } = {}) => {
    const history = messagesRef.current.filter((m) => !m.error && m.content).map((m) => ({ role: m.role, content: m.content })).slice(-8);
    setMessages((prev) => (echo ? [...prev, { id: newId(), role: 'user', content: text }] : prev.filter((m) => !m.error)));
    setPending('chat');
    try {
      const data = await api.chat(text, history);
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', content: data.reply, data, question: text }]);
    } catch (e) {
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', error: true, content: e.message, retry: { type: 'text', payload: text } }]);
    } finally {
      setPending(null);
    }
  }, []);

  const sendFile = useCallback(async (file, { echo = true } = {}) => {
    setMessages((prev) => (echo ? [...prev, { id: newId(), role: 'user', content: `📎 ${file.name}`, attachment: true }] : prev.filter((m) => !m.error)));
    setPending('doc');
    try {
      const { analysis } = await api.analyzeDocument(file);
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', content: `I read your ${analysis.documentType}. ${analysis.summary}`.trim(), doc: analysis }]);
    } catch (e) {
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', error: true, content: e.message, retry: { type: 'file', payload: file } }]);
    } finally {
      setPending(null);
    }
  }, []);

  // Kick off with the question / file the user started from on the home page.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (seed.text) sendText(seed.text);
    else if (seed.file) sendFile(seed.file);
  }, [seed, sendText, sendFile]);

  const retry = (m) => (m.retry.type === 'file' ? sendFile(m.retry.payload, { echo: false }) : sendText(m.retry.payload, { echo: false }));
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && !m.error);

  return (
    <div className="chat-interface">
      <div className="chat-history" ref={scrollRef} aria-live="polite">
        {messages.length === 0 && !pending && (
          <div className="chat-empty">
            <Suspense fallback={<div className="hero3d-small" />}><Hero3D size="small" /></Suspense>
            <p>Ask SAARTHI about any government service, in any Indian language.</p>
            <div className="followups">
              {STARTERS.map((s) => <button key={s} type="button" className="followup-chip" onClick={() => sendText(s)}>{s}</button>)}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.role === 'user' ? 'user' : 'system'} ${m.error ? 'error' : ''}`}>
            <div className={`chat-avatar ${m.role === 'user' ? 'user-avatar' : 'system-avatar'}`}>
              {m.role === 'user' ? (m.attachment ? <FileText size={16} /> : <User size={16} />) : <ShieldCheck size={16} strokeWidth={2.5} />}
            </div>
            <div className="chat-content">
              {m.doc ? (
                <DocumentResult result={m.doc} compact onAsk={(q) => sendText(q)} />
              ) : (
                <div className="msg-text"><Linkified text={m.content} /></div>
              )}
              {m.error && (
                <button type="button" className="widget-btn secondary retry-inline" onClick={() => retry(m)} disabled={!!pending}>
                  <RotateCcw size={14} /> Try again
                </button>
              )}
              {m.role === 'assistant' && !m.error && !m.doc && <MessageTools text={m.content} />}
              {m.data && <ServiceCard data={m.data} question={m.question} />}
              {m === lastAssistant && !pending && m.data?.followUps?.length > 0 && (
                <div className="followups">
                  {m.data.followUps.map((f) => <button key={f} type="button" className="followup-chip" onClick={() => sendText(f)}>{f}</button>)}
                </div>
              )}
              {m.data?.provider === 'offline' && <div className="offline-note">Offline mode — answer from SAARTHI’s verified guide.</div>}
            </div>
          </div>
        ))}

        {pending && (
          <div className="chat-bubble system">
            <div className="chat-avatar system-avatar"><ShieldCheck size={16} strokeWidth={2.5} /></div>
            <div className="chat-content"><ReasoningUI steps={pending === 'doc' ? DOC_STEPS : CHAT_STEPS} /></div>
          </div>
        )}
      </div>

      <div className="chat-input-wrapper">
        <DynamicInputBar onSubmit={sendText} onFile={sendFile} autoFocus disabled={!!pending} />
        <p className="chat-disclaimer">SAARTHI can make mistakes. Always confirm on the official portal. Never share OTPs or full Aadhaar numbers.</p>
      </div>
    </div>
  );
};

export default ChatInterface;
