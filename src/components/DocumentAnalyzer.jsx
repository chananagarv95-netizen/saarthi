import React, { useState } from 'react';
import { UploadCloud, FileText, X, CheckCircle2 } from 'lucide-react';
import './DocumentAnalyzer.css';

const DocumentAnalyzer = ({ onClose }) => {
  const [state, setState] = useState('upload'); // 'upload' | 'processing' | 'result'

  const handleUpload = () => {
    setState('processing');
    setTimeout(() => {
      setState('result');
    }, 3000);
  };

  return (
    <div className="modal-overlay">
      <div className={`doc-modal ${state === 'result' ? 'expanded' : ''}`}>
        <button className="close-btn" onClick={onClose}><X size={20} /></button>
        
        {state === 'upload' && (
          <div className="upload-state" onClick={handleUpload}>
            <div className="upload-box">
              <UploadCloud size={48} className="upload-icon" strokeWidth={1.5} />
              <h3>Upload Document</h3>
              <p>Drag and drop or click to browse</p>
            </div>
          </div>
        )}

        {state === 'processing' && (
          <div className="processing-state">
            <div className="doc-preview scanning">
              <FileText size={64} strokeWidth={1} color="var(--color-primary)" />
              <div className="scan-line"></div>
            </div>
            <h3>Analyzing Document...</h3>
            <p>Extracting data and verifying with official records</p>
          </div>
        )}

        {state === 'result' && (
          <div className="result-state">
            <div className="result-left">
              <div className="doc-preview verified">
                <FileText size={64} strokeWidth={1} color="var(--color-primary)" />
                <div className="verified-badge">
                  <CheckCircle2 size={28} fill="var(--color-success)" color="white" />
                </div>
              </div>
              <div className="doc-info">
                <h4>Class_12_Marksheet.pdf</h4>
                <span>Verified by CBSE</span>
              </div>
            </div>
            <div className="result-right">
              <h3>AI Summary</h3>
              <p className="summary-text">I've verified your Class 12th Marksheet. I noted your graduation date (May 2025) and your score of 94%.</p>
              
              <div className="result-actions">
                <div className="action-pill success">
                  ✨ You are now eligible for 4 new scholarships.
                </div>
              </div>
              
              <button className="primary-btn" onClick={onClose}>Continue Workflow</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentAnalyzer;
