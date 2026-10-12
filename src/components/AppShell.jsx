import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, LayoutGrid, Sparkles, FileText, PenLine, CalendarCheck, History, User, Search, Plus, Menu } from 'lucide-react';
import CommandPalette from './CommandPalette';
import { api } from '../services/api';
import { DEFAULT_PROFILE, useProfile, useTracker } from '../services/storage';
import { dueLabel } from '../services/dates';

const NAV = [
  { group: 'Assist', items: [
    { to: '/app', label: 'Home', icon: Home, end: true },
    { to: '/app/chat', label: 'Assistant', icon: MessageCircle },
    { to: '/app/services', label: 'Services', icon: LayoutGrid }
  ] },
  { group: 'Tools', items: [
    { to: '/app/schemes', label: 'Scheme finder', icon: Sparkles },
    { to: '/app/documents', label: 'Documents', icon: FileText },
    { to: '/app/letters', label: 'Letters & RTI', icon: PenLine },
    { to: '/app/tracker', label: 'Tracker', icon: CalendarCheck, badge: 'due' }
  ] },
  { group: 'You', items: [
    { to: '/app/history', label: 'History', icon: History },
    { to: '/app/profile', label: 'Profile', icon: User }
  ] }
];

const AI_LABEL = { online: 'AI online', offline: 'Offline guide', unreachable: 'Server unreachable' };

export const Logo = () => (
  <Link to="/" className="logo" aria-label="SAARTHI home"><span className="logo-mark">S</span>SAARTHI</Link>
);

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const [seed, setSeed] = useState(() => ({ id: crypto.randomUUID() }));
  const [ai, setAi] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profile = { ...DEFAULT_PROFILE, ...useProfile() };
  const dueCount = useTracker().filter((t) => !t.done && dueLabel(t.date).cls !== 'later').length;

  useEffect(() => { api.health().then(setAi).catch(() => setAi({ ai: 'unreachable', providers: [] })); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('keydown', onKey); };
  }, []);

  // Questions asked on the landing page arrive as router state (kept out of the URL).
  useEffect(() => {
    const q = location.state?.ask;
    if (q) { setSeed({ id: crypto.randomUUID(), text: q }); navigate(pathname, { replace: true, state: null }); }
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  const startChat = (patch = {}) => { setSeed({ id: crypto.randomUUID(), ...patch }); navigate('/app/chat'); };
  const initials = profile.name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="shell">
      <a href="#content" className="skip-link">Skip to content</a>
      <div className="aurora" /><div className="grain" />

      <aside className="sidebar" aria-label="Main navigation">
        <Logo />
        {NAV.map((g) => (
          <nav key={g.group} aria-label={g.group}>
            <div className="nav-group">{g.group}</div>
            {g.items.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} strokeWidth={1.8} /> {label}
                {badge === 'due' && dueCount > 0 && <span className="nav-count">{dueCount}</span>}
              </NavLink>
            ))}
          </nav>
        ))}
        <div className="sidebar-foot">
          {ai && (
            <div className={`status-card ${ai.ai}`}>
              <strong><span className="dot-live" /> {AI_LABEL[ai.ai]}</strong>
              <span>{ai.ai === 'online' ? `Powered by ${ai.providers.join(' → ')}` : ai.ai === 'offline' ? 'Answers from the verified guide' : 'Check your connection'}</span>
            </div>
          )}
        </div>
      </aside>

      <div className="main">
        <header className={`topbar ${scrolled ? 'scrolled' : ''}`}>
          <div className="topbar-logo"><Logo /></div>
          <button type="button" className="search-trigger" onClick={() => setPaletteOpen(true)} aria-label="Search (Ctrl+K)">
            <Search size={17} /> <span>Search services, tools, or ask…</span> <kbd>⌘K</kbd>
          </button>
          <div className="topbar-right">
            {pathname === '/app/chat' && <button type="button" className="btn btn-sm" onClick={() => startChat()}><Plus size={15} /> New chat</button>}
            <Link to="/app/profile" className="avatar" aria-label="Profile">{initials || <User size={17} />}</Link>
          </div>
        </header>

        <main id="content">
          <Outlet context={{ startChat, seed, ai }} />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Main navigation">
        {[{ to: '/app', label: 'Home', icon: Home, end: true }, { to: '/app/chat', label: 'Ask', icon: MessageCircle }, { to: '/app/services', label: 'Services', icon: LayoutGrid }, { to: '/app/letters', label: 'Letters', icon: PenLine }].map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}><Icon size={21} strokeWidth={1.8} />{label}</NavLink>
        ))}
        <button type="button" onClick={() => setPaletteOpen(true)}><Menu size={21} strokeWidth={1.8} />More</button>
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onAsk={(text) => startChat({ text })} onNewChat={() => startChat()} />
    </div>
  );
};

export default AppShell;
