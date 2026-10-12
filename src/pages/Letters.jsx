import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Check, Printer, Download, Share2, ExternalLink, Trash2, Wand2, FileText } from 'lucide-react';
import { api } from '../services/api';
import { useDraftTypes } from '../services/hooks';
import { DEFAULT_PROFILE, storage, useLetters, useProfile } from '../services/storage';

const ICONS = { RTI: '⚖️', GRIEVANCE: '📣', LOST_DOCUMENT: '🚓', CYBER_FRAUD: '🛡️', CONSUMER: '🛒', GENERAL: '✉️' };
const CONTACT_KEY = 'saarthi_contact'; // kept separate from the profile so it is never sent with chat requests

const readContact = () => { try { return JSON.parse(localStorage.getItem(CONTACT_KEY)) || {}; } catch { return {}; } };
const writeContact = (c) => { try { localStorage.setItem(CONTACT_KEY, JSON.stringify(c)); } catch { /* ignore */ } };

const Paper = ({ text }) => (
  <div className="paper" aria-label="Letter preview">
    {String(text).split(/(\[[^\]]+\])/g).map((part, i) => (/^\[.*\]$/.test(part) ? <span key={i} className="placeholder">{part}</span> : part))}
  </div>
);

const LetterActions = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(result.letter); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* blocked */ } };
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([result.letter], { type: 'text/plain;charset=utf-8' }));
    a.download = `${result.title.replace(/[^\w]+/g, '-').toLowerCase()}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div className="paper-actions">
      <button type="button" className="btn btn-primary btn-sm" onClick={copy}>{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</button>
      <button type="button" className="btn btn-sm" onClick={() => window.print()}><Printer size={14} /> Print / PDF</button>
      <button type="button" className="btn btn-sm" onClick={download}><Download size={14} /> .txt</button>
      <button type="button" className="btn btn-sm" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(result.letter)}`, '_blank', 'noopener')}><Share2 size={14} /> WhatsApp</button>
    </div>
  );
};

const Letters = () => {
  const [params, setParams] = useSearchParams();
  const { data, error: typesError } = useDraftTypes();
  const profile = { ...DEFAULT_PROFILE, ...useProfile() };
  const saved = useLetters();
  const typeId = params.get('type') || 'RTI';
  const type = data?.types.find((t) => t.id === typeId);

  const [details, setDetails] = useState({});
  const [contact, setContact] = useState(() => ({ name: profile.name, ...readContact() }));
  const [result, setResult] = useState(null);
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => { setDetails({}); setResult(null); }, [typeId]);

  const set = (key, value) => setDetails((d) => ({ ...d, [key]: value }));
  const missing = type?.fields.filter((f) => f.required && !String(details[f.key] || '').trim()) || [];

  const generate = async (e) => {
    e.preventDefault();
    writeContact({ address: contact.address, phone: contact.phone, name: contact.name });
    setState('loading');
    setError('');
    try {
      const r = await api.draft(typeId, { ...details, ...contact });
      setResult(r);
      storage.saveLetter({ type: typeId, title: r.title, letter: r.letter, instructions: r.instructions, portal: r.portal });
      setState('idle');
      setTimeout(() => document.querySelector('.paper')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  };

  return (
    <div className="content page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Letters & RTI</h1>
          <p className="page-sub">Formal applications and complaints, correctly formatted in seconds. Missing details stay highlighted so nothing is invented.</p>
        </div>
      </div>

      {typesError && <div className="notice bad">Couldn’t load letter types. Check your connection.</div>}
      {!data && !typesError && <div className="type-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}</div>}

      {data && (
        <div className="type-grid">
          {data.types.map((t) => (
            <button key={t.id} type="button" className={`card hoverable type-card ${t.id === typeId ? 'active' : ''}`} onClick={() => setParams({ type: t.id })} aria-pressed={t.id === typeId}>
              <span style={{ fontSize: 24 }}>{ICONS[t.id]}</span>
              <h3>{t.title}</h3>
              <p>{t.blurb}</p>
            </button>
          ))}
        </div>
      )}

      {type && (
        <div className="letter-layout">
          <form className="card pad-lg" onSubmit={generate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 className="section-title">{ICONS[type.id]} {type.title}</h2>
            {type.fields.map((f) => (
              f.type === 'checkbox' ? (
                <label key={f.key} className="check"><input type="checkbox" checked={!!details[f.key]} onChange={(e) => set(f.key, e.target.checked)} /> {f.label}</label>
              ) : (
                <label key={f.key} className="field">
                  <span className="field-label">{f.label}{f.required && ' *'}</span>
                  {f.type === 'textarea'
                    ? <textarea className="textarea" value={details[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} maxLength={2000} />
                    : <input className="input" value={details[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} maxLength={300} />}
                </label>
              )
            ))}
            <div className="divider" style={{ margin: '4px 0' }} />
            <div className="field-label">Your details (saved on this device only)</div>
            <div className="form-grid">
              <label className="field"><span className="field-label">Full name</span><input className="input" value={contact.name || ''} onChange={(e) => setContact({ ...contact, name: e.target.value })} autoComplete="name" /></label>
              <label className="field"><span className="field-label">Phone</span><input className="input" value={contact.phone || ''} onChange={(e) => setContact({ ...contact, phone: e.target.value })} inputMode="tel" autoComplete="tel" /></label>
              <label className="field span-2"><span className="field-label">Address</span><input className="input" value={contact.address || ''} onChange={(e) => setContact({ ...contact, address: e.target.value })} autoComplete="street-address" /></label>
            </div>
            {error && <div className="notice bad">{error}</div>}
            <button type="submit" className="btn btn-primary btn-lg" disabled={state === 'loading' || missing.length > 0}>
              {state === 'loading' ? <><span className="spinner" /> Drafting…</> : <><Wand2 size={17} /> Generate letter</>}
            </button>
            {missing.length > 0 && <span className="field-hint">Fill the required fields: {missing.map((f) => f.label.replace(/\s*\(.*\)/, '')).join(', ')}</span>}
            {profile.language !== 'English' && <span className="field-hint">With AI online, the letter is also translated into {profile.language}.</span>}
          </form>

          <div>
            {result ? (
              <>
                <Paper text={result.letter} />
                <LetterActions result={result} />
                <div className="card" style={{ marginTop: 16 }}>
                  <div className="field-label" style={{ marginBottom: 10 }}>How to submit</div>
                  <ol className="numbered">{result.instructions.map((s, i) => <li key={i}>{s}</li>)}</ol>
                  {result.portal && <a href={result.portal} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ marginTop: 14 }}><ExternalLink size={14} /> {result.portal.replace(/^https?:\/\//, '')}</a>}
                </div>
              </>
            ) : (
              <div className="paper" style={{ display: 'grid', placeItems: 'center', color: '#8a8a94', textAlign: 'center' }}>
                <div><FileText size={34} style={{ margin: '0 auto 10px' }} />Your letter will appear here,<br />ready to print, copy or share.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {saved.length > 0 && (
        <section className="section">
          <div className="section-head"><h2 className="section-title">Recent letters</h2></div>
          <div className="list">
            {saved.map((l) => (
              <div key={l.id} className="card hoverable row">
                <span style={{ fontSize: 20 }}>{ICONS[l.type] || '✉️'}</span>
                <button type="button" className="row-body" style={{ textAlign: 'left' }} onClick={() => { setParams({ type: l.type }); setTimeout(() => setResult(l), 0); }}>
                  <div className="row-title">{l.title}</div>
                  <div className="row-sub">{new Date(l.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                </button>
                <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => storage.removeLetter(l.id)} aria-label="Delete letter"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Letters;
