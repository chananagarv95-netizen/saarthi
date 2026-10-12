import { Component, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import AppShell from './components/AppShell';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Services from './pages/Services';
import Schemes from './pages/Schemes';
import Documents from './pages/Documents';
import Letters from './pages/Letters';
import Tracker from './pages/Tracker';
import History from './pages/History';
import Profile from './pages/Profile';

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error(error); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="content page" style={{ textAlign: 'center', paddingTop: 100 }}>
        <h1 className="page-title">Something went wrong</h1>
        <p className="page-sub" style={{ margin: '10px auto 24px' }}>Your data is safe on this device.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reload SAARTHI</button>
      </div>
    );
  }
}

const NotFound = () => (
  <div className="content page" style={{ textAlign: 'center', paddingTop: 100 }}>
    <h1 className="page-title">Page not found</h1>
    <Link to="/app" className="btn btn-primary" style={{ marginTop: 24 }}>Go to SAARTHI</Link>
  </div>
);

// One listener powers the cursor spotlight on every `.hoverable` card.
const useSpotlight = () => {
  useEffect(() => {
    const onMove = (e) => {
      const el = e.target.closest?.('.hoverable');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
};

const App = () => {
  const { pathname } = useLocation();
  useSpotlight();
  return (
    <ErrorBoundary key={pathname}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:id" element={<Services />} />
          <Route path="schemes" element={<Schemes />} />
          <Route path="documents" element={<Documents />} />
          <Route path="letters" element={<Letters />} />
          <Route path="tracker" element={<Tracker />} />
          <Route path="history" element={<History />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
