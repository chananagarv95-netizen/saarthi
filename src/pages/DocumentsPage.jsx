import React, { useState, useRef } from 'react';
import { documentApi } from '../services/api';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import './DocumentsPage.css';

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp';

const DocumentsPage = () => {
  const [state, setState] = useState('idle'); // idle | uploading | analysing | result | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setState('uploading');
    setError(null);
    try {
      setState('analysing');
      const data = await documentApi.verify(file);
      setResult(data.analysis);
      setState('result');
    } catch (e) {
      setError(e.message || 'Upload failed. Please try again.');
      setState('error');
    }
  };

  const handleFile = (e) => processFile(e.target.files?.[0]);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]); };
  const reset = () => { setState('idle'); setResult(null); setError(null); setFileName(''); };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Document Centre</h1>
        <p className="page-subtitle">Upload and verify government documents with AI</p>
      </div>

      {state === 'idle' && (
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept={ACCEPTED} onChange={handleFile} style={{ display: 'none' }} />
          <div className="upload-icon"><Upload size={32} /></div>
          <h3>Drop your document here</h3>
          <p>or <span className="link-text">browse to upload</span></p>
          <p className="upload-hint">PDF, JPG, PNG, WEBP up to 10MB</p>
        </div>
      )}

      {(state === 'uploading' || state === 'analysing') && (
        <div className="processing-card">
          <Loader size={32} className="spin" />
          <h3>{state === 'uploading' ? 'Uploading document...' : 'Analysing with AI...'}</h3>
          <p>{state === 'analysing' ? 'Extracting fields and verifying authenticity' : 'Sending to server'}</p>
          <div className="progress-bar"><div className="progress-fill" style={{ width: state === 'analysing' ? '70%' : '30%' }} /></div>
        </div>
      )}

      {state === 'error' && (
        <div className="result-card error">
          <XCircle size={32} className="result-icon error" />
          <h3>Upload Failed</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={reset}>Try Again</button>
        </div>
      )}

      {state === 'result' && result && (
        <div className="result-card success">
          <div className="result-header">
            <CheckCircle size={24} className="result-icon success" />
            <div>
              <h3>{result.documentType || 'Document Analysed'}</h3>
              <span className={`status-badge ${result.isValid ? 'valid' : 'invalid'}`}>
                {result.isValid ? '✓ Valid' : '✗ Invalid'}
              </span>
            </div>
            <div className="confidence-chip">{Math.round((result.confidence || 0) * 100)}% confidence</div>
          </div>

          <div className="extracted-fields">
            <h4>Extracted Information</h4>
            <div className="fields-grid">
              {Object.entries(result.extractedFields || {}).filter(([, v]) => v).map(([key, val]) => (
                <div key={key} className="field-row">
                  <span className="field-key">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="field-val">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {result.missingFields?.length > 0 && (
            <div className="missing-fields">
              <AlertCircle size={16} />
              <span>Missing: {result.missingFields.join(', ')}</span>
            </div>
          )}

          <div className="result-meta">
            <div><strong>Status:</strong> {result.verificationStatus}</div>
            <div><strong>Eligibility:</strong> {result.eligibilityStatus}</div>
            <div><strong>Department:</strong> {result.department}</div>
          </div>

          {result.nextSteps?.length > 0 && (
            <div className="next-steps">
              <h4>Next Steps</h4>
              <ol>{result.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </div>
          )}

          <button className="retry-btn" onClick={reset}>Upload Another</button>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
