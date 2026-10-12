import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Paperclip, ArrowUp } from 'lucide-react';
import { storage, speechLang } from '../services/storage';
import './DynamicInputBar.css';

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

const DynamicInputBar = ({ onSubmit, onFile, autoFocus, disabled, placeholder = 'Ask about any government service…' }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const submit = (text) => {
    const clean = text.trim();
    if (!clean || disabled) return;
    onSubmit?.(clean);
    setValue('');
  };

  const toggleVoice = () => {
    if (listening) { recognitionRef.current?.stop(); return; }
    const rec = new SpeechRecognition();
    rec.lang = speechLang(storage.getProfile().language);
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join('');
      setValue(transcript);
      if (e.results[e.results.length - 1].isFinal) submit(transcript);
    };
    rec.onerror = (e) => setVoiceError(e.error === 'not-allowed' ? 'Microphone permission denied' : 'Could not hear you, please try again');
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setVoiceError('');
    setListening(true);
    rec.start();
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onFile?.(file);
  };

  return (
    <div className={`input-container ${isFocused ? 'focused' : ''} ${listening ? 'listening' : ''}`}>
      <form className="input-wrapper" onSubmit={(e) => { e.preventDefault(); submit(value); }}>
        {onFile && (
          <>
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,image/*" onChange={handleFile} hidden />
            <button type="button" className="icon-btn" aria-label="Attach a document to check" title="Attach a document (PDF, photo)" onClick={() => fileRef.current?.click()} disabled={disabled}>
              <Paperclip size={20} />
            </button>
          </>
        )}

        <input
          type="text"
          placeholder={listening ? 'Listening…' : placeholder}
          aria-label="Your question"
          className="dynamic-input"
          value={value}
          maxLength={2000}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus={autoFocus}
        />

        {value.trim() ? (
          <button type="submit" className="submit-btn" aria-label="Send" disabled={disabled}>
            <ArrowUp size={20} strokeWidth={2.5} />
          </button>
        ) : SpeechRecognition ? (
          <button type="button" className={`icon-btn pulse-hover ${listening ? 'mic-live' : ''}`} aria-label={listening ? 'Stop listening' : 'Speak your question'} aria-pressed={listening} onClick={toggleVoice} disabled={disabled}>
            {listening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        ) : null}
      </form>
      {voiceError && <div className="voice-error" role="status">{voiceError}</div>}
    </div>
  );
};

export default DynamicInputBar;
