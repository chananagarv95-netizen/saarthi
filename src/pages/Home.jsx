import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Archive, Sparkles, MessageCircle, ScanText, PenLine, LayoutGrid } from 'lucide-react';
import AskBar from '../components/AskBar';
import { api } from '../services/api';
import { DEFAULT_PROFILE, useChats, useProfile, useTracker, useVault } from '../services/storage';
import { dueLabel, expiryStatus } from '../services/dates';

const Scene3D = lazy(() => import('../components/Scene3D'));

const QUICK = [
  { e: '🪪', t: 'Lost Aadhaar', s: 'Recover & download', q: 'I lost my Aadhaar card, how do I get it back?' },
  { e: '🛡️', t: 'Cyber fraud', s: 'Freeze money fast', q: 'Someone cheated me through a UPI payment link' },
  { e: '🎓', t: 'Scholarships', s: 'NSP applications', q: 'How do I apply for a government scholarship?' },
  { e: '🛂', t: 'Passport', s: 'Fresh or re-issue', q: 'I need a new passport' },
  { e: '🏥', t: 'Ayushman card', s: '₹5 lakh cover', q: 'How do I get an Ayushman Bharat card?' },
  { e: '🌾', t: 'PM-KISAN', s: 'Installment status', q: 'My PM-KISAN installment has not come' },
  { e: '💳', t: 'PAN card', s: 'Instant e-PAN', q: 'How do I get a PAN card quickly?' },
  { e: '🍚', t: 'Ration card', s: 'Apply or correct', q: 'How do I apply for a ration card?' }
];

const TOOLS = [
  { to: '/app/schemes', icon: Sparkles, t: 'Scheme finder', d: 'Benefits you qualify for', g: 'linear-gradient(135deg,#ffb057,#ff7a6b)' },
  { to: '/app/documents', icon: ScanText, t: 'Document check', d: 'Read, verify & store', g: 'linear-gradient(135deg,#3ddc84,#7cf0b7)' },
  { to: '/app/letters', icon: PenLine, t: 'Letters & RTI', d: 'Formal drafts in seconds', g: 'linear-gradient(135deg,#a78bfa,#7c8cff)' },
  { to: '/app/services', icon: LayoutGrid, t: 'All services', d: '24 guided services', g: 'linear-gradient(135deg,#7c8cff,#5ad1ff)' }
];

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

const Home = () => {
  const { startChat } = useOutletContext();
  const profile = { ...DEFAULT_PROFILE, ...useProfile() };
  const tracker = useTracker();
  const vault = useVault();
  const chats = useChats();
  const [schemeCount, setSchemeCount] = useState(null);

  const open = tracker.filter((t) => !t.done).sort((a, b) => a.date.localeCompare(b.date));
  const dueSoon = open.filter((t) => dueLabel(t.date).cls !== 'later').length;
  const expiring = vault.filter((d) => { const e = expiryStatus(d.expiryDate); return e && e.cls !== 'ok'; }).length;
  const profileReady = profile.age !== '' && profile.occupation;
  const firstName = profile.name.trim().split(/\s+/)[0];

  useEffect(() => {
    if (profileReady) api.schemes(profile).then((r) => setSchemeCount(r.total)).catch(() => {});
  }, [profileReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="content page">
      <section className="dash-hero">
        <div>
          <span className="eyebrow"><span className="dot" /> {greeting()}{firstName ? `, ${firstName}` : ''}</span>
          <h1>What can I help you <span className="serif gradient-text">get done</span> today?</h1>
          <p>Ask in any Indian language — or attach a document to check it.</p>
          <AskBar onSubmit={(text) => startChat({ text })} onFile={(file) => startChat({ file })} />
          <div className="chips-row">
            {QUICK.slice(0, 3).map((q) => <button key={q.t} type="button" className="chip" onClick={() => startChat({ text: q.q })}>{q.e} {q.t}</button>)}
          </div>
        </div>
        <div className="dash-orb">
          <Suspense fallback={null}><Scene3D variant="orb" /></Suspense>
        </div>
      </section>

      <div className="stat-grid">
        <Link to="/app/tracker" className="card hoverable stat lift">
          <span className="stat-label"><CalendarCheck size={15} /> Due this week</span>
          <span className="stat-value">{dueSoon}</span>
          <span className="stat-foot">{open.length} open tasks</span>
        </Link>
        <Link to="/app/documents?tab=vault" className="card hoverable stat lift">
          <span className="stat-label"><Archive size={15} /> Document vault</span>
          <span className="stat-value">{vault.length}</span>
          <span className="stat-foot">{expiring ? `${expiring} expiring soon` : 'No expiry alerts'}</span>
        </Link>
        <Link to="/app/schemes" className="card hoverable stat lift">
          <span className="stat-label"><Sparkles size={15} /> Schemes for you</span>
          <span className="stat-value">{schemeCount ?? '—'}</span>
          <span className="stat-foot">{profileReady ? 'Based on your profile' : 'Complete your profile'}</span>
        </Link>
        <Link to="/app/history" className="card hoverable stat lift">
          <span className="stat-label"><MessageCircle size={15} /> Conversations</span>
          <span className="stat-value">{chats.length}</span>
          <span className="stat-foot">Saved on this device</span>
        </Link>
      </div>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Popular right now</h2><Link to="/app/services" className="section-link">All services →</Link></div>
        <div className="tile-grid">
          {QUICK.map((q) => (
            <button key={q.t} type="button" className="card hoverable tile lift" onClick={() => startChat({ text: q.q })}>
              <span className="tile-icon">{q.e}</span>
              <span className="tile-title">{q.t}</span>
              <span className="tile-sub">{q.s}</span>
              <ArrowRight size={16} className="arrow" />
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Tools</h2></div>
        <div className="tool-grid">
          {TOOLS.map(({ to, icon: Icon, t, d, g }) => (
            <Link key={to} to={to} className="card hoverable tool lift">
              <span className="tool-icon" style={{ background: g }}><Icon size={22} /></span>
              <h3>{t}</h3>
              <p>{d}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Upcoming</h2><Link to="/app/tracker" className="section-link">Open tracker →</Link></div>
        {open.length ? (
          <div className="task-list">
            {open.slice(0, 4).map((t) => {
              const due = dueLabel(t.date);
              return (
                <Link to="/app/tracker" key={t.id} className="card hoverable task">
                  <span className={`task-dot ${due.cls}`} />
                  <span className="task-title">{t.title}</span>
                  <span className={`badge ${due.cls === 'overdue' ? 'bad' : due.cls === 'soon' ? 'warn' : ''}`}>{due.text}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty">No upcoming tasks. Tap <strong>Track</strong> on any answer, or save a document to get expiry reminders.</div>
        )}
      </section>
    </div>
  );
};

export default Home;
