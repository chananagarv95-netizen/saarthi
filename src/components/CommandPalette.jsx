import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { useServices } from '../services/hooks';

const PAGES = [
  { icon: '🏠', label: 'Home', to: '/app' },
  { icon: '💬', label: 'New conversation', to: '/app/chat', newChat: true },
  { icon: '🗂️', label: 'All services', to: '/app/services' },
  { icon: '✨', label: 'Scheme finder', to: '/app/schemes', hint: 'Benefits you qualify for' },
  { icon: '📄', label: 'Document check & vault', to: '/app/documents' },
  { icon: '✍️', label: 'Letters & RTI', to: '/app/letters' },
  { icon: '📅', label: 'Tracker', to: '/app/tracker' },
  { icon: '🕘', label: 'History', to: '/app/history' },
  { icon: '👤', label: 'Profile & language', to: '/app/profile' }
];
const TOOLS = [
  { icon: '⚖️', label: 'Draft an RTI application', to: '/app/letters?type=RTI' },
  { icon: '🚓', label: 'Report a lost document to police', to: '/app/letters?type=LOST_DOCUMENT' },
  { icon: '🛡️', label: 'Write a cyber fraud complaint', to: '/app/letters?type=CYBER_FRAUD' },
  { icon: '📣', label: 'Write a public grievance', to: '/app/letters?type=GRIEVANCE' },
  { icon: '🛒', label: 'Consumer complaint notice', to: '/app/letters?type=CONSUMER' }
];

const CommandPalette = ({ open, onClose, onAsk, onNewChat }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const { data } = useServices();

  useEffect(() => {
    if (open) { setQuery(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 10); }
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (item) => !q || `${item.label} ${item.hint || ''}`.toLowerCase().includes(q);
    const services = (data?.services || []).map((s) => ({ icon: s.emoji, label: s.title, hint: s.department, to: `/app/services/${s.id}` }));
    const out = [];
    if (q) out.push({ title: 'Ask', items: [{ icon: '🤖', label: `Ask SAARTHI: “${query.trim()}”`, ask: query.trim() }] });
    out.push({ title: 'Go to', items: PAGES.filter(match) });
    out.push({ title: 'Tools', items: TOOLS.filter(match) });
    out.push({ title: 'Services', items: services.filter(match).slice(0, q ? 12 : 6) });
    return out.filter((g) => g.items.length);
  }, [query, data]);

  const flat = groups.flatMap((g) => g.items);

  const run = (item) => {
    onClose();
    if (item.ask) onAsk(item.ask);
    else if (item.newChat) onNewChat();
    else navigate(item.to);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && flat[active]) { e.preventDefault(); run(flat[active]); }
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => { listRef.current?.querySelector('.palette-item.active')?.scrollIntoView({ block: 'nearest' }); }, [active]);

  if (!open) return null;
  let index = -1;

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <Search size={18} />
          <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKey} placeholder="Search services, tools, or ask anything…" aria-label="Search" />
        </div>
        <div className="palette-list" ref={listRef}>
          {groups.map((g) => (
            <div key={g.title}>
              <div className="palette-group">{g.title}</div>
              {g.items.map((item) => {
                index += 1;
                const i = index;
                return (
                  <button key={`${g.title}-${item.label}`} type="button" className={`palette-item ${i === active ? 'active' : ''}`} onMouseEnter={() => setActive(i)} onClick={() => run(item)}>
                    <span className="pi-icon">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.hint && <span className="pi-hint">{item.hint}</span>}
                  </button>
                );
              })}
            </div>
          ))}
          {!flat.length && <div className="empty" style={{ margin: 8 }}>No matches</div>}
        </div>
        <div className="palette-foot"><span>↑↓ navigate</span><span><CornerDownLeft size={11} /> open</span><span>esc close</span></div>
      </div>
    </div>
  );
};

export default CommandPalette;
