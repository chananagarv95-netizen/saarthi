import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BrainCircuit, Clock, FileText, User, Settings } from 'lucide-react';
import './Sidebar.css';

const NAV_ITEMS = [
  { icon: BrainCircuit, label: 'AI Assistant', path: '/' },
  { icon: Clock, label: 'History', path: '/history' },
  { icon: FileText, label: 'Documents', path: '/documents' },
  { icon: Settings, label: 'Timeline', path: '/timeline' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path) => {
    if (path === '/') return pathname === '/' || pathname === '/chat';
    return pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="logo-mark" onClick={() => navigate('/')} title="SAARTHI Home">S</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            className={`nav-item ${isActive(path) ? 'active' : ''}`}
            title={label}
            onClick={() => navigate(path)}
          >
            <Icon size={22} strokeWidth={1.5} />
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}
          title="Profile"
          onClick={() => navigate('/profile')}
        >
          <User size={22} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
