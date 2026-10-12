import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Plus, FileText, Plane, Car, HeartPulse, Wheat, GraduationCap, ShieldAlert, CreditCard, ArrowRight, ShieldCheck, Languages, Lock } from 'lucide-react';
import './App.css';

import Sidebar from './components/Sidebar';
import DynamicInputBar from './components/DynamicInputBar';
import ActionCard from './components/ActionCard';
import ChatInterface from './components/ChatInterface';
import HistoryPage from './pages/HistoryPage';
import TrackerPage from './pages/TrackerPage';
import { dueLabel } from './services/dates';
import DocumentsPage from './pages/DocumentsPage';
import ProfilePage from './pages/ProfilePage';
import SchemesPage from './pages/SchemesPage';
import { api } from './services/api';
import { DEFAULT_PROFILE, useProfile, useTracker } from './services/storage';

const Hero3D = lazy(() => import('./components/Hero3D'));

const QUICK_ACTIONS = [
  { icon: FileText, title: 'Lost Aadhaar', q: 'I lost my Aadhaar card, how do I get it back?' },
  { icon: ShieldAlert, title: 'Cyber fraud', q: 'Someone cheated me through a UPI payment link' },
  { icon: GraduationCap, title: 'Scholarship', q: 'How do I apply for a government scholarship?' },
  { icon: Plane, title: 'Passport', q: 'I need a new passport' },
  { icon: Car, title: 'Driving licence', q: 'I want to renew my driving licence' },
  { icon: HeartPulse, title: 'Ayushman card', q: 'How do I get an Ayushman Bharat card?' },
  { icon: Wheat, title: 'PM-KISAN', q: 'My PM-KISAN installment has not come' },
  { icon: CreditCard, title: 'PAN card', q: 'How do I get a PAN card quickly?' }
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error(error); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page-container crash">
        <h1 className="page-title">Something went wrong</h1>
        <p className="page-subtitle">Your data is safe on this device. Reload to continue.</p>
        <button type="button" className="retry-btn" onClick={() => window.location.reload()}>Reload SAARTHI</button>
      </div>
    );
  }
}

function HomePage({ onAsk, onFile }) {
  const profile = { ...DEFAULT_PROFILE, ...useProfile() };
  const upcoming = useTracker().filter((t) => !t.done).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const firstName = profile.name.trim().split(/\s+/)[0];
  const profileIncomplete = !profile.age || !profile.occupation;

  return (
    <div className="content-wrapper">
      <section className="hero">
        <Suspense fallback={<div className="hero3d-large" />}><Hero3D size="large" /></Suspense>
        <h1 className="greeting">{greeting()}{firstName ? `, ${firstName}` : ''} <span className="wave" aria-hidden="true">👋</span></h1>
        <p className="subtitle">Any government service, explained step by step — in your language.</p>
      </section>

      <DynamicInputBar onSubmit={onAsk} onFile={onFile} />

      <div className="trust-strip">
        <span><ShieldCheck size={14} /> Verified official links</span>
        <span><Languages size={14} /> 13 Indian languages · voice</span>
        <span><Lock size={14} /> Your data stays on your device</span>
      </div>

      <section className="quick-actions-container">
        <h2 className="section-title">Popular services</h2>
        <div className="quick-actions">
          {QUICK_ACTIONS.map((a) => <ActionCard key={a.title} icon={a.icon} title={a.title} onClick={() => onAsk(a.q)} />)}
        </div>
      </section>

      {profileIncomplete ? (
        <Link to="/schemes" className="promo-card">
          <div>
            <strong>Find schemes you qualify for</strong>
            <span>Answer 4 quick questions — we match you against 19 central schemes.</span>
          </div>
          <ArrowRight size={20} />
        </Link>
      ) : null}

      <section className="home-tracker">
        <div className="section-row">
          <h2 className="section-title">Your upcoming tasks</h2>
          <Link to="/tracker" className="section-link">Open tracker</Link>
        </div>
        {upcoming.length ? (
          <ul className="mini-tracker">
            {upcoming.map((t) => {
              const due = dueLabel(t.date);
              return (
                <li key={t.id}>
                  <span className={`due-dot ${due.cls}`} />
                  <span className="mini-title">{t.title}</span>
                  <span className={`mini-due ${due.cls}`}>{due.text}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-hint">Track renewals, application deadlines and bill dates here. Tap “Track this” on any answer to add it.</p>
        )}
      </section>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [seed, setSeed] = useState(() => ({ id: crypto.randomUUID() }));
  const [ai, setAi] = useState(null);

  useEffect(() => {
    api.health().then(setAi).catch(() => setAi({ ai: 'unreachable' }));
  }, []);

  useEffect(() => { document.querySelector('.main-content')?.scrollTo(0, 0); }, [pathname]);

  const startChat = (patch) => { setSeed({ id: crypto.randomUUID(), ...patch }); navigate('/chat'); };

  return (
    <div className="app-layout">
      <a href="#main" className="skip-link">Skip to content</a>
      <Sidebar />

      <main className={`main-content ${pathname === '/chat' ? 'is-chat' : ''}`} id="main">
        <header className="header">
          <Link to="/" className="brand">SAARTHI</Link>
          <div className="header-right">
            {ai && (
              <span className={`ai-pill ${ai.ai}`} title={ai.ai === 'online' ? `AI providers: ${ai.providers.join(', ')}` : 'Answers come from SAARTHI’s verified offline guide'}>
                <span className="ai-dot" /> {ai.ai === 'online' ? 'AI online' : ai.ai === 'offline' ? 'Offline guide' : 'Server unreachable'}
              </span>
            )}
            {pathname === '/chat' && (
              <button type="button" className="new-chat-btn" onClick={() => startChat({})}><Plus size={16} /> New chat</button>
            )}
            <Link to="/profile" className="avatar" aria-label="Your profile"><User size={20} /></Link>
          </div>
        </header>

        <ErrorBoundary key={pathname}>
          <Routes>
            <Route path="/" element={<HomePage onAsk={(text) => startChat({ text })} onFile={(file) => startChat({ file })} />} />
            <Route path="/chat" element={<ChatInterface key={seed.id} seed={seed} />} />
            <Route path="/schemes" element={<SchemesPage onAsk={(text) => startChat({ text })} />} />
            <Route path="/documents" element={<DocumentsPage onAsk={(text) => startChat({ text })} />} />
            <Route path="/tracker" element={<TrackerPage />} />
            <Route path="/history" element={<HistoryPage onRestore={(chat) => startChat({ id: chat.id, messages: chat.messages, createdAt: chat.createdAt })} />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<div className="page-container"><h1 className="page-title">Page not found</h1><Link to="/">Go home</Link></div>} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
