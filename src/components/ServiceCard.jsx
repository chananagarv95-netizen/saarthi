import { useState } from 'react';
import { ExternalLink, Phone, ChevronDown, ChevronUp, Loader, Clock, IndianRupee, CalendarPlus, Check, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import './ServiceCard.css';

// en-CA formats as YYYY-MM-DD in the user's local timezone (toISOString would use UTC).
const inDays = (n) => new Date(Date.now() + n * 864e5).toLocaleDateString('en-CA');

const AddToTracker = ({ title, workflow }) => {
  const [added, setAdded] = useState(false);
  return (
    <button
      type="button"
      className="widget-btn secondary"
      disabled={added}
      onClick={() => { storage.addTrackerItem({ title, workflow, date: inDays(7), notes: 'Added from SAARTHI chat' }); setAdded(true); }}
    >
      {added ? <><Check size={14} /> In your tracker</> : <><CalendarPlus size={14} /> Track this</>}
    </button>
  );
};

const StepGuide = ({ workflow, context }) => {
  const [data, setData] = useState(null);
  const [state, setState] = useState('closed'); // closed | loading | open | error

  const toggle = async () => {
    if (state === 'open') return setState('closed');
    if (data) return setState('open');
    setState('loading');
    try {
      setData(await api.workflow(workflow, context));
      setState('open');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="checklist-section">
      <button type="button" className="checklist-toggle" onClick={toggle} aria-expanded={state === 'open'}>
        {state === 'loading' ? <Loader size={14} className="spin-sm" /> : state === 'open' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {state === 'loading' ? 'Preparing your personalised guide…' : state === 'open' ? 'Hide step-by-step guide' : state === 'error' ? 'Could not load — tap to retry' : 'Show step-by-step guide'}
      </button>
      {state === 'open' && data && (
        <div className="checklist-body">
          <div className="checklist-meta">
            {data.timeline && <span><Clock size={12} /> {data.timeline}</span>}
            {data.fees && <span><IndianRupee size={12} /> {data.fees}</span>}
          </div>
          <ol className="steps-list">
            {data.steps.map((s, i) => (
              <li key={i} className="step-row">
                <span className="step-num">{i + 1}</span>
                <div><div className="step-title">{s.title}</div>{s.description && <div className="step-desc">{s.description}</div>}</div>
              </li>
            ))}
          </ol>
          {data.tips?.length > 0 && (
            <div className="tips-box">
              <strong>Tips</strong>
              <ul>{data.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ServiceCard = ({ data, question }) => {
  const { service } = data;
  const docs = data.requiredDocuments?.length ? data.requiredDocuments : service.documents;
  const [ready, setReady] = useState(() => new Set());
  const isGeneral = service.id === 'GENERAL';

  if (isGeneral && !docs.length) return null;

  const toggleDoc = (i) => setReady((prev) => {
    const next = new Set(prev);
    if (!next.delete(i)) next.add(i);
    return next;
  });

  return (
    <div className="widget-card">
      <div className="widget-header">
        <span aria-hidden="true">{service.emoji}</span>
        <div>
          <h4>{service.title}</h4>
          <div className="widget-sub">{service.department}</div>
        </div>
      </div>

      {data.estimatedTime && <div className="eta-chip"><Clock size={12} /> {data.estimatedTime}</div>}
      {service.fees && <div className="eta-chip"><IndianRupee size={12} /> {service.fees}</div>}

      {docs.length > 0 && (
        <div className="doc-ready">
          <div className="doc-ready-head">
            <strong>Documents you need</strong>
            <span>{ready.size}/{docs.length} ready</span>
          </div>
          <div className="doc-progress"><div style={{ width: `${(ready.size / docs.length) * 100}%` }} /></div>
          <ul>
            {docs.map((d, i) => (
              <li key={i}>
                <label>
                  <input type="checkbox" checked={ready.has(i)} onChange={() => toggleDoc(i)} />
                  <span>{d}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="widget-actions">
        {service.portal && (
          <a href={service.portal} target="_blank" rel="noopener noreferrer" className="widget-btn primary">
            <ExternalLink size={14} /> Official portal
          </a>
        )}
        {service.helpline && (
          <a href={`tel:${service.helpline.replace(/[^0-9+]/g, '')}`} className="widget-btn secondary">
            <Phone size={14} /> {service.helpline}
          </a>
        )}
        {!isGeneral && <AddToTracker title={service.title} workflow={service.id} />}
      </div>
      {service.portal && <div className="verified-note"><ShieldCheck size={12} /> Link verified against official government sources</div>}

      {!isGeneral && <StepGuide workflow={service.id} context={question} />}
    </div>
  );
};

export default ServiceCard;
