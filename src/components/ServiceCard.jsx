import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Phone, MapPin, ChevronDown, ChevronUp, Clock, IndianRupee, CalendarPlus, Check, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { localDate } from '../services/dates';

export const TrackButton = ({ title, workflow, className = 'btn btn-sm' }) => {
  const [added, setAdded] = useState(false);
  return (
    <button type="button" className={className} disabled={added} onClick={() => { storage.addTrackerItem({ title, workflow, date: localDate(7), notes: 'Follow up' }); setAdded(true); }}>
      {added ? <><Check size={14} /> Tracking</> : <><CalendarPlus size={14} /> Track</>}
    </button>
  );
};

export const DocChecklist = ({ docs }) => {
  const [ready, setReady] = useState(() => new Set());
  if (!docs?.length) return null;
  const toggle = (i) => setReady((prev) => { const next = new Set(prev); if (!next.delete(i)) next.add(i); return next; });
  return (
    <div className="checklist">
      <div className="checklist-head"><span>Documents you need</span><span className="muted">{ready.size}/{docs.length} ready</span></div>
      <div className="progress"><div style={{ width: `${(ready.size / docs.length) * 100}%` }} /></div>
      {docs.map((d, i) => (
        <label key={i} className="check-row">
          <input type="checkbox" checked={ready.has(i)} onChange={() => toggle(i)} />
          <span>{d}</span>
        </label>
      ))}
    </div>
  );
};

// Personalised steps fetched on demand from /api/workflow.
export const StepGuide = ({ workflow, context, autoLoad = false }) => {
  const [data, setData] = useState(null);
  const [state, setState] = useState('closed'); // closed | loading | open | error

  const load = async () => {
    setState('loading');
    try { setData(await api.workflow(workflow, context)); setState('open'); } catch { setState('error'); }
  };
  useEffect(() => { if (autoLoad) load(); }, [autoLoad, workflow]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => (state === 'open' ? setState('closed') : data ? setState('open') : load());

  return (
    <div>
      <button type="button" className="toggle-link" onClick={toggle} aria-expanded={state === 'open'}>
        {state === 'loading' ? <span className="spinner" /> : state === 'open' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        {state === 'loading' ? 'Preparing your personalised guide…' : state === 'open' ? 'Hide step-by-step guide' : state === 'error' ? 'Couldn’t load — retry' : 'Personalised step-by-step guide'}
      </button>
      {state === 'open' && data && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="meta-row">
            {data.timeline && <span className="badge info"><Clock size={12} /> {data.timeline}</span>}
            {data.fees && <span className="badge"><IndianRupee size={12} /> {data.fees}</span>}
          </div>
          <ol className="steps">
            {data.steps.map((s, i) => (
              <li key={i} className="step"><div><div className="step-title">{s.title}</div>{s.description && <div className="step-desc">{s.description}</div>}</div></li>
            ))}
          </ol>
          {data.tips?.length > 0 && <div className="tips"><strong>Pro tips</strong><ul>{data.tips.map((t, i) => <li key={i}>{t}</li>)}</ul></div>}
        </div>
      )}
    </div>
  );
};

export const ServiceActions = ({ service, compact }) => (
  <div className="svc-actions">
    {service.portal && <a className="btn btn-primary btn-sm" href={service.portal} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Official portal</a>}
    {service.helpline && <a className="btn btn-sm" href={`tel:${service.helpline.replace(/[^0-9+]/g, '')}`}><Phone size={14} /> {service.helpline}</a>}
    {service.officeUrl && <a className="btn btn-sm" href={service.officeUrl} target="_blank" rel="noopener noreferrer"><MapPin size={14} /> {compact ? 'Nearest office' : `Nearest ${service.office}`}</a>}
    <TrackButton title={service.title} workflow={service.id} />
  </div>
);

// Card rendered under an assistant answer in chat.
const ServiceCard = ({ data, question }) => {
  const { service } = data;
  if (service.id === 'GENERAL') return null;
  const docs = data.requiredDocuments?.length ? data.requiredDocuments : service.documents;

  return (
    <div className="card svc">
      <div className="svc-head">
        <div className="svc-emoji" aria-hidden="true">{service.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="svc-title">{service.title}</div>
          <div className="svc-dept">{service.department}</div>
        </div>
        <Link to={`/app/services/${service.id}`} className="btn btn-ghost btn-icon btn-sm" aria-label="Open service page" title="Open service page"><ArrowUpRight size={16} /></Link>
      </div>
      {(data.estimatedTime || service.fees) && (
        <div className="meta-row">
          {data.estimatedTime && <span className="badge info"><Clock size={12} /> {data.estimatedTime}</span>}
          {service.fees && <span className="badge"><IndianRupee size={12} /> {service.fees}</span>}
        </div>
      )}
      <DocChecklist docs={docs} />
      <ServiceActions service={service} compact />
      {service.portal && <span className="verified"><ShieldCheck size={13} /> Official link verified by SAARTHI</span>}
      <StepGuide workflow={service.id} context={question} />
    </div>
  );
};

export default ServiceCard;
