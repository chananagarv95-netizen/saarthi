import { CheckCircle, AlertTriangle, XCircle, CalendarClock, Info } from 'lucide-react';
import '../pages/DocumentsPage.css';

const QUALITY = {
  good: { Icon: CheckCircle, label: 'Clear & readable', cls: 'valid' },
  poor: { Icon: AlertTriangle, label: 'Needs attention', cls: 'warn' },
  unreadable: { Icon: XCircle, label: 'Could not read', cls: 'invalid' }
};

const SERVICE_NAMES = {
  LOST_AADHAAR: 'Aadhaar', PASSPORT: 'Passport', DRIVING_LICENCE: 'Driving licence', SCHOLARSHIP: 'Scholarships', INCOME_CERT: 'Income certificate',
  DOMICILE: 'Domicile', BIRTH_CERT: 'Birth certificate', DEATH_CERT: 'Death certificate', MARRIAGE_CERT: 'Marriage certificate', PAN: 'PAN',
  VOTER_ID: 'Voter ID', RATION_CARD: 'Ration card', HEALTHCARE: 'Ayushman Bharat', AGRICULTURE: 'PM-KISAN', CROP_INSURANCE: 'Crop insurance',
  EMPLOYMENT: 'Jobs', PENSION: 'Pension', COMPLAINT: 'Grievance', CONSUMER: 'Consumer complaint', CYBER_FRAUD: 'Cyber fraud',
  ELECTRICITY: 'Electricity', WATER: 'Water', GAS: 'LPG', PROPERTY: 'Property'
};

const expiryState = (date) => {
  const m = String(date).match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  const d = m ? new Date(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`) : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.round((d - Date.now()) / 864e5);
  return days < 0 ? { cls: 'invalid', text: `Expired ${-days} days ago` } : days < 60 ? { cls: 'warn', text: `Expires in ${days} days` } : { cls: 'valid', text: `Valid till ${date}` };
};

const DocumentResult = ({ result, onAsk, compact = false }) => {
  const q = QUALITY[result.quality] || QUALITY.poor;
  const fields = Object.entries(result.extractedFields || {});
  const expiry = result.expiryDate ? expiryState(result.expiryDate) : null;

  return (
    <div className={`result-card ${q.cls === 'valid' ? 'success' : ''} ${compact ? 'compact' : ''}`}>
      <div className="result-header">
        <q.Icon size={24} className={`result-icon ${q.cls}`} />
        <div>
          <h3>{result.documentType}</h3>
          <span className={`status-badge ${q.cls}`}>{q.label}</span>
          {expiry && <span className={`status-badge ${expiry.cls}`}><CalendarClock size={11} /> {expiry.text}</span>}
        </div>
        {result.confidence > 0 && <div className="confidence-chip">{Math.round(result.confidence * 100)}% sure</div>}
      </div>

      {result.summary && <p className="doc-summary">{result.summary}</p>}

      {fields.length > 0 && (
        <div className="extracted-fields">
          <h4>What we read</h4>
          <dl className="fields-grid">
            {fields.map(([k, v]) => (
              <div key={k} className="field-row"><dt className="field-key">{k}</dt><dd className="field-val">{v}</dd></div>
            ))}
          </dl>
        </div>
      )}

      {result.issues?.length > 0 && (
        <div className="missing-fields">
          <AlertTriangle size={16} />
          <ul>{result.issues.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      )}

      {result.nextSteps?.length > 0 && (
        <div className="next-steps">
          <h4>Next steps</h4>
          <ol>{result.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </div>
      )}

      {onAsk && result.usefulFor?.length > 0 && (
        <div className="useful-for">
          <span>Useful for:</span>
          {result.usefulFor.map((w) => (
            <button key={w} type="button" className="followup-chip" onClick={() => onAsk(`How do I use my ${result.documentType} for ${SERVICE_NAMES[w] || w}?`)}>
              {SERVICE_NAMES[w] || w}
            </button>
          ))}
        </div>
      )}

      <p className="doc-disclaimer"><Info size={12} /> AI reading only — not an official verification. Your file is not stored.</p>
    </div>
  );
};

export default DocumentResult;
