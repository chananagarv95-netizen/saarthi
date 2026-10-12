import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, MessageSquare, ChevronRight, Search } from 'lucide-react';
import { storage, useChats } from '../services/storage';
import './HistoryPage.css';

const HistoryPage = ({ onRestore }) => {
  const chats = useChats();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const q = query.trim().toLowerCase();
  const shown = q ? chats.filter((c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content?.toLowerCase().includes(q))) : chats;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Conversation history</h1>
        <p className="page-subtitle">Saved on this device only.</p>
      </div>

      {chats.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>No conversations yet</h3>
          <p>Your chats will appear here once you ask SAARTHI something.</p>
          <button type="button" className="cta-btn" onClick={() => navigate('/')}>Start a conversation</button>
        </div>
      ) : (
        <>
          <label className="history-search">
            <Search size={16} />
            <input type="search" placeholder="Search conversations" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search conversations" />
          </label>
          <ul className="history-list">
            {shown.map((chat) => (
              <li key={chat.id}>
                <button type="button" className="history-item" onClick={() => onRestore(chat)}>
                  <div className="history-icon"><MessageSquare size={20} /></div>
                  <div className="history-body">
                    <h4 className="history-title">{chat.title}</h4>
                    <div className="history-meta">
                      <Clock size={12} />
                      <span>{new Date(chat.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      <span>·</span>
                      <span>{chat.messages.length} messages</span>
                    </div>
                  </div>
                  <div className="history-actions">
                    <span role="button" tabIndex={0} className="icon-action-btn delete" aria-label="Delete conversation" title="Delete"
                      onClick={(e) => { e.stopPropagation(); storage.deleteChat(chat.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); storage.deleteChat(chat.id); } }}>
                      <Trash2 size={16} />
                    </span>
                    <ChevronRight size={18} className="history-arrow" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {shown.length === 0 && <p className="empty-hint">No conversations match “{query}”.</p>}
        </>
      )}
    </div>
  );
};

export default HistoryPage;
