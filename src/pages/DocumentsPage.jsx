import { useRef, useState } from 'react';
import { Upload, XCircle, Loader, Lock, Camera } from 'lucide-react';
import { api, MAX_UPLOAD_MB } from '../services/api';
import DocumentResult from '../components/DocumentResult';
import './DocumentsPage.css';

const DocumentsPage = ({ onAsk }) => {
  const [state, setState] = useState('idle'); // idle | analysing | result | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  const processFile = async (file) => {
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

  const pick = (e) => { processFile(e.target.files?.[0]); e.target.value = ''; };
  const reset = () => { setState('idle'); setResult(null); setError(''); setFileName(''); };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Document check</h1>
        <p className="page-subtitle">Upload a certificate or ID — SAARTHI reads it, flags problems and tells you what it’s useful for.</p>
      </div>

      {state === 'idle' && (
        <>
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]); }}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,image/*" onChange={pick} hidden />
            <div className="upload-icon"><Upload size={32} /></div>
            <h3>Drop your document here</h3>
            <p>or <span className="link-text">browse to upload</span></p>
            <p className="upload-hint">PDF, JPG, PNG or WEBP · photos are compressed automatically · max {MAX_UPLOAD_MB} MB</p>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={pick} hidden />
          <button type="button" className="widget-btn secondary camera-btn" onClick={() => cameraRef.current?.click()}><Camera size={14} /> Take a photo</button>
          <div className="privacy-note"><Lock size={16} /> <span>Files are processed in memory and never stored. Aadhaar numbers are masked automatically. Avoid uploading bank cards or passwords.</span></div>
        </>
      )}

      {state === 'analysing' && (
        <div className="processing-card" role="status">
          <Loader size={32} className="spin" />
          <h3>Reading {fileName}…</h3>
          <p>Extracting key details and checking for issues</p>
          <div className="progress-bar"><div className="progress-fill indeterminate" /></div>
        </div>
      )}

      {state === 'error' && (
        <div className="result-card error">
          <XCircle size={32} className="result-icon error" />
          <h3>Could not read the document</h3>
          <p>{error}</p>
          <button type="button" className="retry-btn" onClick={reset}>Try again</button>
        </div>
      )}

      {state === 'result' && result && (
        <>
          <DocumentResult result={result} onAsk={onAsk} />
          <button type="button" className="retry-btn" onClick={reset}>Check another document</button>
        </>
      )}
    </div>
  );
};

export default DocumentsPage;
