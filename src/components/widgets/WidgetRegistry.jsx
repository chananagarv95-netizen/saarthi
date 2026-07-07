import React, { useState, useRef } from 'react';
import { workflowApi, documentApi } from '../../services/api';
import { Upload, CheckCircle, Loader, ExternalLink, ChevronDown, ChevronUp, FileText, Clock, DollarSign, MapPin } from 'lucide-react';
import './WidgetRegistry.css';

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

const WorkflowModal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

const DocumentUploadBtn = ({ label = 'Verify Documents', onResult }) => {
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState('uploading');
    try {
      const data = await documentApi.verify(file);
      setResult(data.analysis);
      setState('done');
      if (onResult) onResult(data.analysis);
    } catch {
      setState('error');
    }
  };

  if (state === 'done') return (
    <div className="upload-success">
      <CheckCircle size={16} /> Document verified successfully!
    </div>
  );
  if (state === 'error') return (
    <button className="widget-btn secondary" onClick={() => setState('idle')}>Retry Upload</button>
  );

  return (
    <>
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFile} style={{ display: 'none' }} />
      <button
        className="widget-btn primary"
        onClick={() => inputRef.current?.click()}
        disabled={state === 'uploading'}
      >
        {state === 'uploading' ? <><Loader size={14} className="spin-sm" /> Uploading...</> : <><Upload size={14} /> {label}</>}
      </button>
    </>
  );
};

const WorkflowChecklist = ({ workflow, context }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (data) { setOpen(o => !o); return; }
    setLoading(true);
    try {
      const res = await workflowApi.get(workflow, context);
      setData(res);
      setOpen(true);
    } catch { setData({ error: true }); }
    finally { setLoading(false); }
  };

  return (
    <div className="checklist-section">
      <button className="checklist-toggle" onClick={load}>
        {loading ? <Loader size={14} className="spin-sm" /> : open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {loading ? 'Generating checklist...' : open ? 'Hide checklist' : 'View full checklist'}
      </button>
      {open && data && !data.error && (
        <div className="checklist-body">
          <div className="checklist-meta">
            <span><Clock size={12} /> {data.timeline}</span>
            <span><DollarSign size={12} /> {data.fees}</span>
            <span><MapPin size={12} /> <a href={data.governmentPortal} target="_blank" rel="noreferrer">Official Portal</a></span>
          </div>
          <div className="doc-list">
            <strong>Required Documents:</strong>
            <ul>{(data.requiredDocuments || []).map((d, i) => <li key={i}>{d}</li>)}</ul>
          </div>
          <div className="steps-list">
            <strong>Steps:</strong>
            {(data.steps || []).map((s, i) => (
              <div key={i} className="step-row">
                <span className="step-num">{s.stepNumber}</span>
                <div><div className="step-title">{s.title}</div><div className="step-desc">{s.description}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── INDIVIDUAL WIDGETS ───────────────────────────────────────────────────────

const AadhaarWidget = () => {
  const [sent, setSent] = useState(false);
  return (
    <div className="widget-card">
      <div className="widget-header"><span>🪪</span><h4>Request e-Aadhaar</h4></div>
      <p>OTP will be sent to your registered mobile number to retrieve your Aadhaar.</p>
      <div className="widget-actions">
        <button className="widget-btn primary" onClick={() => setSent(true)} disabled={sent}>
          {sent ? <><CheckCircle size={14} /> OTP Sent!</> : 'Send OTP to Mobile'}
        </button>
        <a href="https://myaadhaar.uidai.gov.in" target="_blank" rel="noreferrer" className="widget-btn secondary">
          <ExternalLink size={14} /> UIDAI Portal
        </a>
      </div>
      <WorkflowChecklist workflow="LOST_AADHAAR" context="Lost Aadhaar card retrieval" />
    </div>
  );
};

const ScholarshipWidget = ({ metadata }) => {
  const [docResult, setDocResult] = useState(null);
  return (
    <div className="widget-card">
      <div className="widget-header"><span>🎓</span><h4>Scholarship Portal</h4></div>
      <p>Upload your income certificate to verify eligibility for government scholarships.</p>
      {docResult && (
        <div className="inline-result">
          <CheckCircle size={14} /> Detected: <strong>{docResult.documentType}</strong> — {docResult.verificationStatus}
        </div>
      )}
      <div className="widget-actions">
        <DocumentUploadBtn label="Verify Documents" onResult={setDocResult} />
        <a href="https://scholarships.gov.in" target="_blank" rel="noreferrer" className="widget-btn secondary">
          <ExternalLink size={14} /> NSP Portal
        </a>
      </div>
      <WorkflowChecklist workflow="SCHOLARSHIP" context="scholarship eligibility and document verification" />
    </div>
  );
};

const DrivingLicenceWidget = () => {
  const [step, setStep] = useState(0);
  const [dlNumber, setDlNumber] = useState('');
  const [state, setDlState] = useState('');
  const [eligible, setEligible] = useState(null);
  const [showWorkflow, setShowWorkflow] = useState(false);

  const steps = [
    { label: 'Enter DL Number', content: (
      <div className="wf-step">
        <label>Driving Licence Number</label>
        <input className="wf-input" placeholder="e.g. DL0120110012345" value={dlNumber} onChange={e => setDlNumber(e.target.value)} />
        <button className="widget-btn primary" onClick={() => setStep(1)} disabled={!dlNumber}>Next →</button>
      </div>
    )},
    { label: 'Select State', content: (
      <div className="wf-step">
        <label>State of Issue</label>
        <select className="wf-input" value={state} onChange={e => setDlState(e.target.value)}>
          <option value="">Select State</option>
          {['Delhi','Maharashtra','Karnataka','Tamil Nadu','Uttar Pradesh','Gujarat'].map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="widget-btn primary" onClick={() => setStep(2)} disabled={!state}>Check Eligibility →</button>
      </div>
    )},
    { label: 'Eligibility', content: (
      <div className="wf-step">
        <div className="eligible-badge">✓ Eligible for Renewal</div>
        <p>Your licence is due for renewal. No test required if renewed within 1 year of expiry.</p>
        <button className="widget-btn primary" onClick={() => setStep(3)}>See Required Documents →</button>
      </div>
    )},
    { label: 'Documents', content: (
      <div className="wf-step">
        <ul className="doc-checklist">
          {['Form 9 (Application)', 'Original DL', 'Medical Certificate (Form 1A)', 'Address Proof', 'Passport Photo'].map((d, i) => (
            <li key={i}><CheckCircle size={14} className="check-green" /> {d}</li>
          ))}
        </ul>
        <button className="widget-btn primary" onClick={() => setStep(4)}>See Fees →</button>
      </div>
    )},
    { label: 'Fees', content: (
      <div className="wf-step">
        <div className="fee-table">
          <div className="fee-row"><span>Renewal Fee</span><strong>₹200</strong></div>
          <div className="fee-row"><span>Smart Card Fee</span><strong>₹200</strong></div>
          <div className="fee-row total"><span>Total</span><strong>₹400</strong></div>
        </div>
        <button className="widget-btn primary" onClick={() => setStep(5)}>Proceed →</button>
      </div>
    )},
    { label: 'Apply', content: (
      <div className="wf-step">
        <div className="success-banner"><CheckCircle size={18} /> Ready to apply!</div>
        <div className="final-actions">
          <a href="https://parivahan.gov.in" target="_blank" rel="noreferrer" className="widget-btn primary"><ExternalLink size={14} /> Open Parivahan Portal</a>
          <button className="widget-btn secondary" onClick={() => setStep(0)}>Start Over</button>
        </div>
      </div>
    )}
  ];

  if (!showWorkflow) return (
    <div className="widget-card">
      <div className="widget-header"><span>🚗</span><h4>Driving Licence Renewal</h4></div>
      <p>Renew your DL without visiting the RTO. Guided step-by-step within SAARTHI.</p>
      <div className="widget-actions">
        <button className="widget-btn primary" onClick={() => setShowWorkflow(true)}>Start Renewal</button>
        <a href="https://parivahan.gov.in" target="_blank" rel="noreferrer" className="widget-btn secondary"><ExternalLink size={14} /> Parivahan</a>
      </div>
    </div>
  );

  return (
    <div className="widget-card">
      <div className="widget-header"><span>🚗</span><h4>DL Renewal — Step {step + 1} of {steps.length}</h4></div>
      <div className="wf-steps-bar">
        {steps.map((s, i) => (
          <div key={i} className={`wf-dot ${i <= step ? 'active' : ''}`} />
        ))}
      </div>
      <div className="wf-label">{steps[step].label}</div>
      {steps[step].content}
    </div>
  );
};

const PassportWidget = () => (
  <div className="widget-card">
    <div className="widget-header"><span>🛂</span><h4>Passport Seva</h4></div>
    <p>Schedule an appointment at the nearest Passport Seva Kendra. Documents needed: Birth certificate, Address proof, Photo ID.</p>
    <div className="doc-list compact">
      <ul>{['Original Aadhaar/PAN', 'Birth Certificate', 'Address Proof', '2 Passport Photos', 'Old Passport (if renewal)'].map((d, i) => <li key={i}>{d}</li>)}</ul>
    </div>
    <div className="widget-actions">
      <a href="https://www.passportindia.gov.in" target="_blank" rel="noreferrer" className="widget-btn primary"><ExternalLink size={14} /> Book Appointment</a>
      <a href="https://www.passportindia.gov.in/AppOnlineProject/StatusTracker/trackStatusForRow" target="_blank" rel="noreferrer" className="widget-btn secondary">Track Status</a>
    </div>
    <WorkflowChecklist workflow="PASSPORT" context="passport application and renewal" />
  </div>
);

const IncomeCertWidget = () => {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="widget-card">
      <div className="widget-header"><span>📄</span><h4>Income Certificate</h4></div>
      <p>Apply for a digitally signed income certificate from the Revenue Department.</p>
      <div className="widget-actions">
        {submitted ? (
          <div className="upload-success"><CheckCircle size={14} /> Application submitted! Track on DigiLocker.</div>
        ) : (
          <button className="widget-btn primary" onClick={() => setSubmitted(true)}>Apply Now</button>
        )}
        <a href="https://digilocker.gov.in" target="_blank" rel="noreferrer" className="widget-btn secondary"><ExternalLink size={14} /> DigiLocker</a>
      </div>
      <WorkflowChecklist workflow="INCOME_CERT" context="income certificate application" />
    </div>
  );
};

const ComplaintWidget = () => {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="widget-card">
      <div className="widget-header"><span>🚨</span><h4>Civic Issue Registry</h4></div>
      {submitted ? (
        <div className="upload-success"><CheckCircle size={16} /> Complaint #{Math.floor(Math.random()*900000+100000)} filed successfully!</div>
      ) : (
        <>
          <textarea className="wf-input" rows={3} placeholder="Describe the civic issue (broken road, water supply, etc.)" value={text} onChange={e => setText(e.target.value)} />
          <div className="widget-actions">
            <button className="widget-btn primary" onClick={() => setSubmitted(true)} disabled={!text.trim()}>Submit Complaint</button>
            <a href="https://pgportal.gov.in" target="_blank" rel="noreferrer" className="widget-btn secondary"><ExternalLink size={14} /> CPGRAMS</a>
          </div>
        </>
      )}
    </div>
  );
};

const HealthcareWidget = () => (
  <div className="widget-card">
    <div className="widget-header"><span>🏥</span><h4>Ayushman Bharat</h4></div>
    <p>Get ₹5 lakh health coverage. Check your eligibility and find empanelled hospitals.</p>
    <div className="widget-actions">
      <a href="https://pmjay.gov.in" target="_blank" rel="noreferrer" className="widget-btn primary">Check Eligibility</a>
      <a href="https://hospitals.pmjay.gov.in" target="_blank" rel="noreferrer" className="widget-btn secondary"><ExternalLink size={14} /> Find Hospitals</a>
    </div>
    <WorkflowChecklist workflow="HEALTHCARE" context="Ayushman Bharat health scheme eligibility" />
  </div>
);

const AgricultureWidget = () => {
  const [registered, setRegistered] = useState(false);
  return (
    <div className="widget-card">
      <div className="widget-header"><span>🌾</span><h4>Farmer Services</h4></div>
      <p>Register your crop for MSP procurement and seed/fertilizer subsidies.</p>
      {registered ? (
        <div className="upload-success"><CheckCircle size={14} /> Registered for MSP! Your Kisan ID has been created.</div>
      ) : (
        <div className="widget-actions">
          <button className="widget-btn primary" onClick={() => setRegistered(true)}>Register Crop</button>
          <a href="https://pmkisan.gov.in" target="_blank" rel="noreferrer" className="widget-btn secondary"><ExternalLink size={14} /> PM-KISAN</a>
        </div>
      )}
      <WorkflowChecklist workflow="AGRICULTURE" context="MSP crop registration and farmer subsidies" />
    </div>
  );
};

const EmploymentWidget = () => (
  <div className="widget-card">
    <div className="widget-header"><span>💼</span><h4>Skill India / NCS</h4></div>
    <p>Find government jobs, skill training programs, and employment exchanges near you.</p>
    <div className="widget-actions">
      <a href="https://www.ncs.gov.in" target="_blank" rel="noreferrer" className="widget-btn primary">View Jobs</a>
      <a href="https://skillindia.gov.in" target="_blank" rel="noreferrer" className="widget-btn secondary"><ExternalLink size={14} /> Skill India</a>
    </div>
  </div>
);

const PropertyWidget = () => (
  <div className="widget-card">
    <div className="widget-header"><span>🏠</span><h4>Property Registration</h4></div>
    <p>Access digital land records (Bhoomi/Dilruba) and register property online.</p>
    <div className="widget-actions">
      <a href="https://igrs.gov.in" target="_blank" rel="noreferrer" className="widget-btn primary">Register Property</a>
      <a href="https://bhulekh.up.nic.in" target="_blank" rel="noreferrer" className="widget-btn secondary"><ExternalLink size={14} /> Land Records</a>
    </div>
    <WorkflowChecklist workflow="PROPERTY" context="property registration and land records" />
  </div>
);

const GeneralWidget = ({ metadata }) => (
  <div className="widget-card">
    <div className="widget-header"><span>ℹ️</span><h4>{metadata?.department || 'Government Services'}</h4></div>
    <p>{metadata?.timeline}</p>
    {metadata?.requiredDocuments?.length > 0 && (
      <div className="doc-list compact">
        <strong>Documents needed:</strong>
        <ul>{metadata.requiredDocuments.map((d, i) => <li key={i}>{d}</li>)}</ul>
      </div>
    )}
    {metadata?.sources?.length > 0 && (
      <div className="widget-actions">
        {metadata.sources.map((s, i) => <span key={i} className="source-chip">{s}</span>)}
      </div>
    )}
  </div>
);

// ─── REGISTRY ─────────────────────────────────────────────────────────────────

const WidgetRegistry = ({ workflow, metadata }) => {
  switch (workflow) {
    case 'LOST_AADHAAR': return <AadhaarWidget />;
    case 'SCHOLARSHIP': return <ScholarshipWidget metadata={metadata} />;
    case 'PASSPORT': return <PassportWidget />;
    case 'DRIVING_LICENCE': return <DrivingLicenceWidget />;
    case 'INCOME_CERT': return <IncomeCertWidget />;
    case 'COMPLAINT': return <ComplaintWidget />;
    case 'PROPERTY': return <PropertyWidget />;
    case 'HEALTHCARE': return <HealthcareWidget />;
    case 'AGRICULTURE': return <AgricultureWidget />;
    case 'EMPLOYMENT': return <EmploymentWidget />;
    case 'GENERAL': return metadata ? <GeneralWidget metadata={metadata} /> : null;
    default: return metadata ? <GeneralWidget metadata={metadata} /> : null;
  }
};

export default WidgetRegistry;
