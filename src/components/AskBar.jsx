import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Paperclip, ArrowUp } from 'lucide-react';
import { storage, speechLang } from '../services/storage';

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

const AskBar = ({ onSubmit, onFile, autoFocus, disabled, placeholder = 'Ask about any government service…' }) => {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => () => recRef.current?.abort(), []);

  const submit = (text) => {
    const clean = text.trim();
    if (!clean || disabled) return;
    onSubmit?.(clean);
    setValue('');
  };

  const toggleVoice = () => {
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SpeechRecognition();
    rec.lang = speechLang(storage.getProfile().language);
    rec.interimResults = true;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join('');
      setValue(transcript);
      if (e.results[e.results.length - 1].isFinal) submit(transcript);
    };
    rec.onerror = (e) => setError(e.error === 'not-allowed' ? 'Microphone permission denied' : 'Didn’t catch that — try again');
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setError('');
    setListening(true);
    rec.start();
  };

  return (
    <form className={`askbar ${focused ? 'focused' : ''} ${listening ? 'listening' : ''}`} onSubmit={(e) => { e.preventDefault(); submit(value); }}>
      {onFile && (
        <>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onFile(f); }} />
          <button type="button" className="ask-icon" aria-label="Attach a document" title="Attach a document (PDF or photo)" onClick={() => fileRef.current?.click()} disabled={disabled}>
            <Paperclip size={19} />
          </button>
        </>
      )}
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={listening ? 'Listening…' : placeholder}
        aria-label="Your question"
        maxLength={2000}
        autoFocus={autoFocus}
      />
      {SpeechRecognition && !value.trim() && (
        <button type="button" className={`ask-icon ${listening ? 'live' : ''}`} onClick={toggleVoice} aria-label={listening ? 'Stop listening' : 'Speak your question'} aria-pressed={listening} disabled={disabled}>
          {listening ? <Square size={16} /> : <Mic size={19} />}
        </button>
      )}
      {(value.trim() || !SpeechRecognition) && (
        <button type="submit" className="ask-send" aria-label="Send" disabled={disabled || !value.trim()}>
          <ArrowUp size={19} strokeWidth={2.5} />
        </button>
      )}
      {error && <span className="ask-error" role="status">{error}</span>}
    </form>
  );
};

export default AskBar;
