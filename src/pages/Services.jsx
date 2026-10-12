import { useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { Search, ArrowLeft, MessageCircle, ShieldCheck, Building2 } from 'lucide-react';
import { useServices } from '../services/hooks';
import { DocChecklist, ServiceActions, StepGuide } from '../components/ServiceCard';

const Loading = () => (
  <div className="svc-grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}</div>
);

const Directory = ({ data }) => {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const q = query.trim().toLowerCase();
  const shown = data.services.filter((s) => (cat === 'all' || s.category === cat) && (!q || `${s.title} ${s.department}`.toLowerCase().includes(q)));

  return (
    <>
      <div className="toolbar">
        <label className="search-input">
          <Search size={17} />
          <input className="input" type="search" placeholder="Search 24 services…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search services" />
        </label>
      </div>
      <div className="chips-row" style={{ marginTop: 0, marginBottom: 22 }}>
        <button type="button" className={`chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>All</button>
        {data.categories.map((c) => <button key={c.id} type="button" className={`chip ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>{c.label}</button>)}
      </div>
      <div className="svc-grid">
        {shown.map((s) => (
          <Link key={s.id} to={`/app/services/${s.id}`} className="card hoverable svc-tile lift">
            <div className="svc-emoji" aria-hidden="true">{s.emoji}</div>
            <div>
              <div className="svc-title">{s.title}</div>
              <div className="svc-dept">{s.department}</div>
            </div>
            <div className="tags">
              {s.helpline && <span className="badge">☎ {s.helpline}</span>}
              {s.portal && <span className="badge ok"><ShieldCheck size={11} /> Official portal</span>}
            </div>
          </Link>
        ))}
      </div>
      {!shown.length && <div className="empty">No services match “{query}”. Try asking the assistant instead.</div>}
    </>
  );
};

const Detail = ({ service }) => {
  const { startChat } = useOutletContext();
  return (
    <>
      <Link to="/app/services" className="back-link"><ArrowLeft size={15} /> All services</Link>
      <div className="detail-hero">
        <div className="detail-emoji" aria-hidden="true">{service.emoji}</div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 className="page-title">{service.title}</h1>
          <p className="page-sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Building2 size={15} /> {service.department}</p>
        </div>
      </div>
      <div style={{ marginTop: 20 }}><ServiceActions service={service} /></div>

      <div className="detail-grid">
        <div className="card pad-lg">
          <h2 className="section-title" style={{ marginBottom: 18 }}>How it works</h2>
          <ol className="steps">
            {service.steps.map((s, i) => <li key={i} className="step"><div className="step-desc" style={{ color: 'var(--text)', fontSize: 14.5 }}>{s}</div></li>)}
          </ol>
          <div className="divider" />
          <StepGuide workflow={service.id} context={`Detailed guide for ${service.title}`} />
        </div>
        <div className="sticky-col">
          <div className="card"><DocChecklist docs={service.documents} /></div>
          {service.fees && <div className="card"><div className="field-label">Fees</div><p style={{ marginTop: 6 }}>{service.fees}</p></div>}
          <div className="card">
            <div className="field-label">Still have questions?</div>
            <p className="small muted" style={{ margin: '6px 0 14px' }}>Ask about your exact situation — in any language.</p>
            <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => startChat({ text: `I need help with ${service.title}` })}><MessageCircle size={16} /> Ask SAARTHI</button>
          </div>
          {service.portal && <span className="verified"><ShieldCheck size={13} /> Portal & helpline verified against official sources</span>}
        </div>
      </div>
    </>
  );
};

const Services = () => {
  const { id } = useParams();
  const { data, error } = useServices();
  const service = id && data?.services.find((s) => s.id === id);

  return (
    <div className="content page" key={id || 'all'}>
      {!id && (
        <div className="page-head">
          <div>
            <h1 className="page-title">Services</h1>
            <p className="page-sub">Every service with verified portals, helplines, documents and the nearest office.</p>
          </div>
        </div>
      )}
      {error && <div className="notice bad">Couldn’t load services. Check your connection and refresh.</div>}
      {!data && !error && <Loading />}
      {data && !id && <Directory data={data} />}
      {data && id && (service ? <Detail service={service} /> : <div className="empty">Service not found. <Link to="/app/services" className="section-link">Browse all</Link></div>)}
    </div>
  );
};

export default Services;
