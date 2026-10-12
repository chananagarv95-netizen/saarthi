import { NavLink, useNavigate } from 'react-router-dom';
import { MessageCircle, Clock, FileText, CalendarCheck, Sparkles, User } from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { icon: MessageCircle, label: 'Assistant', path: '/' },
  { icon: Sparkles, label: 'Schemes', path: '/schemes' },
  { icon: FileText, label: 'Documents', path: '/documents' },
  { icon: CalendarCheck, label: 'Tracker', path: '/tracker' },
  { icon: Clock, label: 'History', path: '/history' }
];

const Sidebar = () => {
  const navigate = useNavigate();
  const item = ({ icon: Icon, label, path }) => (
    <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={label} aria-label={label}>
      <Icon size={22} strokeWidth={1.6} />
      <span className="nav-label">{label}</span>
    </NavLink>
  );

  return (
    <nav className="sidebar" aria-label="Main">
      <button type="button" className="logo-mark" onClick={() => navigate('/')} aria-label="SAARTHI home">S</button>
      <div className="sidebar-nav">{NAV_ITEMS.map(item)}</div>
      <div className="sidebar-bottom">{item({ icon: User, label: 'Profile', path: '/profile' })}</div>
    </nav>
  );
};

export default Sidebar;
