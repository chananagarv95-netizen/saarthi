import { Fragment, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, CalendarClock, Info, Archive, Check } from 'lucide-react';
import { storage } from '../services/storage';
import { expiryStatus } from '../services/dates';

const QUALITY = {
  good: { Icon: CheckCircle2, label: 'Clear & readable', cls: 'ok' },
  poor: { Icon: AlertTriangle, label: 'Needs attention', cls: 'warn' },
  unreadable: { Icon: XCircle, label: 'Could not read', cls: 'bad' }
};

const SERVICE_NAMES = {
  LOST_AADHAAR: 'Aadhaar', PASSPORT: 'Passport', DRIVING_LICENCE: 'Driving licence', SCHOLARSHIP: 'Scholarships', INCOME_CERT: 'Income certificate',
  DOMICILE: 'Domicile', BIRTH_CERT: 'Birth certificate', DEATH_CERT: 'Death certificate', MARRIAGE_CERT: 'Marriage certificate', PAN: 'PAN',
  VOTER_ID: 'Voter ID', RATION_CARD: 'Ration card', HEALTHCARE: 'Ayushman Bharat', AGRICULTURE: 'PM-KISAN', CROP_INSURANCE: 'Crop insurance',
  EMPLOYMENT: 'Jobs', PENSION: 'Pension', COMPLAINT: 'Grievance', CONSUMER: 'Consumer complaint', CYBER_FRAUD: 'Cyber fraud',
  ELECTRICITY: 'Electricity', WATER: 'Water', GAS: 'LPG', PROPERTY: 'Property'
};

const DocumentResult = ({ result, onAsk, filename }) => {
  const [saved, setSaved] = useState(false);
  const q = QUALITY[result.quality] || QUALITY.poor;
  const fields = Object.entries(result.extractedFields || {});
  const expiry = result.expiryDate ? expiryStatus(result.expiryDate) : null;

  const save = () => {
    storage.saveToVault({ documentType: result.documentType, summary: result.summary, fields: result.extractedFields, expiryDate: result.expiryDate, usefulFor: result.usefulFor, filename });
    setSaved(true);
  };

  return (
    <div className="card doc">
      <div className="doc-head">
        <q.Icon size={28} style={{ color: `var(--${q.cls === 'ok' ? 'green' : q.cls === 'warn' ? 'warn' : 'danger'})` }} />
        <div>
          <h3>{result.documentType}</h3>
          <div className="doc-badges">
            <span className={`badge ${q.cls}`}>{q.label}</span>
            {expiry && <span className={`badge ${expiry.cls}`}><CalendarClock size={12} /> {expiry.text}</span>}
          </div>
        </div>
        {result.confidence > 0 && <div className="doc-conf"><strong className="gradient-text">{Math.round(result.confidence * 100)}%</strong><div className="tiny muted">confidence</div></div>}
      </div>

      {result.summary && <p style={{ fontSize: 14.5 }}>{result.summary}</p>}

      {fields.length > 0 && (
        <dl className="kv">
          {fields.map(([k, v]) => <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>)}
        </dl>
      )}

      {result.issues?.length > 0 && <div className="issues">{result.issues.map((x, i) => <div key={i}>⚠ {x}</div>)}</div>}

      {result.nextSteps?.length > 0 && (
        <div>
          <div className="field-label" style={{ marginBottom: 8 }}>Next steps</div>
          <ol className="numbered">{result.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </div>
      )}

      <div className="svc-actions">
        {result.quality !== 'unreadable' && (
          <button type="button" className="btn btn-sm" onClick={save} disabled={saved}>{saved ? <><Check size={14} /> Saved to vault</> : <><Archive size={14} /> Save to vault</>}</button>
        )}
        {onAsk && result.usefulFor?.map((w) => (
          <button key={w} type="button" className="chip" onClick={() => onAsk(`How do I use my ${result.documentType} for ${SERVICE_NAMES[w] || w}?`)}>Use for {SERVICE_NAMES[w] || w}</button>
        ))}
      </div>

      <p className="tiny dim" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> AI reading only, not an official verification. Files are never stored; the vault keeps only the details shown above, on this device.</p>
    </div>
  );
};

export default DocumentResult;
