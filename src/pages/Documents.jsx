import { useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Upload, Camera, Lock, ScanText, Archive, BellPlus, Trash2, Check } from 'lucide-react';
import { api, MAX_UPLOAD_MB } from '../services/api';
import DocumentResult from '../components/DocumentResult';
import { storage, useVault, useTracker } from '../services/storage';
import { expiryStatus, localDate, parseDocDate } from '../services/dates';

const DocumentCheck = () => {
  const { startChat } = useOutletContext();
  const [state, setState] = useState('idle'); // idle | analysing | result | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  const analyze = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setState('analysing');
    try {
      const data = await api.analyzeDocument(file);
      setResult(data.analysis);
      setState('result');
    } catch (e) {
      setError(e.message || 'Upload failed. Please try again.');
      setState('error');
    }
  };
  const pick = (e) => { analyze(e.target.files?.[0]); e.target.value = ''; };

  if (state === 'analysing') return (
    <div className="card scan" role="status">
      <div className="scan-doc" />
      <h3>Reading {fileName}…</h3>
      <p className="muted small">Extracting key details and checking for problems</p>
    </div>
  );
  if (state === 'error') return (
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <h3 style={{ marginBottom: 8 }}>Couldn’t read the document</h3>
      <p className="muted" style={{ marginBottom: 18 }}>{error}</p>
      <button type="button" className="btn btn-primary" onClick={() => setState('idle')}>Try again</button>
    </div>
  );
  if (state === 'result' && result) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DocumentResult result={result} filename={fileName} onAsk={(text) => startChat({ text })} />
      <button type="button" className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => { setState('idle'); setResult(null); }}>Check another document</button>
    </div>
  );

  return (
    <>
      <div
        className={`dropzone ${over ? 'over' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); analyze(e.dataTransfer.files?.[0]); }}
      >
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,image/*" hidden onChange={pick} />
        <div className="dropzone-icon"><Upload size={28} /></div>
        <h3>Drop a certificate, ID or letter</h3>
        <p className="muted">or click to browse · PDF, JPG, PNG, WEBP · up to {MAX_UPLOAD_MB} MB (photos are compressed)</p>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <button type="button" className="btn" onClick={() => cameraRef.current?.click()}><Camera size={16} /> Take a photo</button>
      </div>
      <div className="notice" style={{ marginTop: 18 }}><Lock size={16} /> Files are processed in memory and never stored. Aadhaar numbers are masked automatically. Don’t upload bank cards or passwords.</div>
    </>
  );
};

const Vault = () => {
  const vault = useVault();
  const tracker = useTracker();
  const reminded = new Set(tracker.map((t) => t.vaultId).filter(Boolean));

  const remind = (doc) => {
    const expiry = parseDocDate(doc.expiryDate);
    if (!expiry) return;
    const date = localDate(-30, expiry.getTime());
    storage.addTrackerItem({ title: `Renew ${doc.documentType}`, date: date < localDate() ? localDate() : date, notes: `Expires ${doc.expiryDate}`, vaultId: doc.id });
  };

  if (!vault.length) return <div className="empty">Your vault is empty. Check a document and tap <strong>Save to vault</strong> — SAARTHI will watch its expiry date for you.</div>;

  return (
    <div className="list">
      {vault.map((d) => {
        const exp = d.expiryDate ? expiryStatus(d.expiryDate) : null;
        return (
          <div key={d.id} className="card hoverable row">
            <div className="svc-emoji" aria-hidden="true">📄</div>
            <div className="row-body">
              <div className="row-title">{d.documentType}</div>
              <div className="row-sub">
                {exp ? <span className={`badge ${exp.cls}`}>{exp.text}</span> : <span className="badge">No expiry</span>}
                <span>Saved {new Date(d.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                {d.fields && Object.keys(d.fields).length > 0 && <span>{Object.keys(d.fields).length} fields</span>}
              </div>
            </div>
            {exp && (reminded.has(d.id)
              ? <span className="badge ok"><Check size={12} /> Reminder set</span>
              : <button type="button" className="btn btn-sm" onClick={() => remind(d)}><BellPlus size={14} /> Remind me</button>)}
            <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => storage.removeFromVault(d.id)} aria-label="Remove from vault"><Trash2 size={15} /></button>
          </div>
        );
      })}
    </div>
  );
};

const Documents = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'vault' ? 'vault' : 'check';
  const count = useVault().length;
  return (
    <div className="content narrow page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-sub">Check any certificate or ID in seconds, then keep it in your vault with automatic renewal reminders.</p>
        </div>
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'check'} className={`tab ${tab === 'check' ? 'active' : ''}`} onClick={() => setParams({})}><ScanText size={15} /> Check</button>
          <button type="button" role="tab" aria-selected={tab === 'vault'} className={`tab ${tab === 'vault' ? 'active' : ''}`} onClick={() => setParams({ tab: 'vault' })}><Archive size={15} /> Vault {count > 0 && `(${count})`}</button>
        </div>
      </div>
      {tab === 'check' ? <DocumentCheck /> : <Vault />}
    </div>
  );
};

export default Documents;
