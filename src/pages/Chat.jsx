import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Volume2, Square, Copy, Check, RotateCcw, Share2, Check as Tick } from 'lucide-react';
import AskBar from '../components/AskBar';
import ServiceCard from '../components/ServiceCard';
import DocumentResult from '../components/DocumentResult';
import { api } from '../services/api';
import { storage, speechLang } from '../services/storage';

const Scene3D = lazy(() => import('../components/Scene3D'));

const CHAT_STEPS = ['Understanding your request', 'Finding the right department', 'Checking official sources', 'Preparing your answer'];
const DOC_STEPS = ['Uploading securely', 'Reading the document', 'Extracting key details', 'Checking for issues'];
const STARTERS = ['I lost my Aadhaar card', 'Someone cheated me on UPI', 'How do I get an income certificate?', 'मुझे पेंशन के लिए आवेदन करना है', 'Draft an RTI for my pending complaint'];

const newId = () => crypto.randomUUID();

const Linkified = ({ text }) => String(text).split(/(https?:\/\/[^\s)]+)/g).map((part, i) => (
  /^https?:\/\//.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part.replace(/^https?:\/\/(www\.)?/, '')}</a> : part
));

const Thinking = ({ steps }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (current >= steps.length - 1) return undefined;
    const t = setTimeout(() => setCurrent((c) => c + 1), 1100);
    return () => clearTimeout(t);
  }, [current, steps.length]);
  return (
    <div className="thinking" role="status" aria-live="polite">
      {steps.map((s, i) => (
        <div key={s} className={`thinking-step ${i < current ? 'done' : i === current ? 'active' : ''}`}>
          <span className="tick">{i < current ? <Tick size={14} /> : i === current ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '·'}</span>
          {s}{i === current ? '…' : ''}
        </div>
      ))}
    </div>
  );
};

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
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* blocked */ } };
  const share = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n\n— via SAARTHI`)}`, '_blank', 'noopener');

  return (
    <div className="msg-tools">
      {canSpeak && <button type="button" onClick={speak} aria-label={speaking ? 'Stop reading' : 'Read aloud'} title="Read aloud">{speaking ? <Square size={14} /> : <Volume2 size={15} />}</button>}
      <button type="button" onClick={copy} aria-label="Copy" title="Copy">{copied ? <Check size={15} /> : <Copy size={15} />}</button>
      <button type="button" onClick={share} aria-label="Share on WhatsApp" title="Share on WhatsApp"><Share2 size={15} /></button>
    </div>
  );
};

const Chat = () => {
  const { seed } = useOutletContext();
  return <Conversation key={seed.id} seed={seed} />;
};

const Conversation = ({ seed }) => {
  const [messages, setMessages] = useState(seed.messages || []);
  const [pending, setPending] = useState(null); // null | 'chat' | 'doc'
  const scrollRef = useRef(null);
  const createdAt = useRef(seed.createdAt || new Date().toISOString());
  const startedRef = useRef(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => {
    const clean = messages.filter((m) => !m.error).map(({ retry, ...m }) => m); // eslint-disable-line no-unused-vars
    if (!clean.length) return;
    storage.saveChat({ id: seed.id, title: clean.find((m) => m.role === 'user')?.content.slice(0, 70) || 'Conversation', messages: clean, createdAt: createdAt.current, updatedAt: new Date().toISOString() });
  }, [messages, seed.id]);

  // New answers scroll to their first line; everything else to the bottom.
  useEffect(() => {
    const box = scrollRef.current;
    const last = box?.querySelector('.msg:last-child');
    if (!box || !last) return;
    if (!pending && last.classList.contains('ai')) box.scrollTo({ top: last.offsetTop - 16, behavior: 'smooth' });
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
    } finally { setPending(null); }
  }, []);

  const sendFile = useCallback(async (file, { echo = true } = {}) => {
    setMessages((prev) => (echo ? [...prev, { id: newId(), role: 'user', content: `📎 ${file.name}` }] : prev.filter((m) => !m.error)));
    setPending('doc');
    try {
      const { analysis } = await api.analyzeDocument(file);
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', content: `I read your ${analysis.documentType}. ${analysis.summary}`.trim(), doc: analysis, filename: file.name }]);
    } catch (e) {
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', error: true, content: e.message, retry: { type: 'file', payload: file } }]);
    } finally { setPending(null); }
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (seed.text) sendText(seed.text);
    else if (seed.file) sendFile(seed.file);
  }, [seed, sendText, sendFile]);

  const retry = (m) => (m.retry.type === 'file' ? sendFile(m.retry.payload, { echo: false }) : sendText(m.retry.payload, { echo: false }));
  const lastAi = [...messages].reverse().find((m) => m.role === 'assistant' && !m.error);

  return (
    <div className="chat">
      <div className="chat-scroll" ref={scrollRef}>
        {messages.length === 0 && !pending && (
          <div className="chat-empty page">
            <div className="orb"><Suspense fallback={null}><Scene3D variant="orb" /></Suspense></div>
            <h2>How can I help?</h2>
            <p>Ask about any government service in any Indian language, or attach a document to check it.</p>
            <div className="chips-row">{STARTERS.map((s) => <button key={s} type="button" className="chip" onClick={() => sendText(s)}>{s}</button>)}</div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role === 'user' ? 'user' : 'ai'} ${m.error ? 'error' : ''}`}>
            <div className="msg-avatar">{m.role === 'user' ? 'You' : 'S'}</div>
            <div className="msg-body">
              {m.doc ? <DocumentResult result={m.doc} filename={m.filename} onAsk={(q) => sendText(q)} /> : <div className="msg-bubble"><Linkified text={m.content} /></div>}
              {m.error && <button type="button" className="btn btn-sm" onClick={() => retry(m)} disabled={!!pending} style={{ alignSelf: 'flex-start' }}><RotateCcw size={14} /> Try again</button>}
              {m.role === 'assistant' && !m.error && !m.doc && <MessageTools text={m.content} />}
              {m.data && <ServiceCard data={m.data} question={m.question} />}
              {m === lastAi && !pending && m.data?.followUps?.length > 0 && (
                <div className="chips-row" style={{ marginTop: 0 }}>{m.data.followUps.map((f) => <button key={f} type="button" className="chip" onClick={() => sendText(f)}>{f}</button>)}</div>
              )}
              {m.data?.provider === 'offline' && <span className="msg-meta">Offline mode · answer from SAARTHI’s verified guide</span>}
            </div>
          </div>
        ))}

        {pending && (
          <div className="msg ai">
            <div className="msg-avatar">S</div>
            <div className="msg-body"><Thinking steps={pending === 'doc' ? DOC_STEPS : CHAT_STEPS} /></div>
          </div>
        )}
      </div>

      <div className="chat-composer">
        <AskBar onSubmit={sendText} onFile={sendFile} autoFocus disabled={!!pending} />
        <p className="chat-disclaimer">SAARTHI can make mistakes — confirm on the official portal. Never share OTPs, PINs or full Aadhaar numbers.</p>
      </div>
    </div>
  );
};

export default Chat;
