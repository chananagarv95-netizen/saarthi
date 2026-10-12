import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { MessageSquare, Trash2, Search } from 'lucide-react';
import { storage, useChats } from '../services/storage';

const History = () => {
  const { startChat } = useOutletContext();
  const chats = useChats();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = q ? chats.filter((c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content?.toLowerCase().includes(q))) : chats;

  return (
    <div className="content narrow page">
      <div className="page-head">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-sub">Your conversations, saved only on this device.</p>
        </div>
      </div>

      {!chats.length ? (
        <div className="empty">No conversations yet. <Link to="/app/chat" className="section-link">Ask your first question →</Link></div>
      ) : (
        <>
          <div className="toolbar">
            <label className="search-input">
              <Search size={17} />
              <input className="input" type="search" placeholder="Search conversations" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search conversations" />
            </label>
          </div>
          <div className="list">
            {shown.map((chat) => (
              <div key={chat.id} className="card hoverable row">
                <div className="svc-emoji" style={{ width: 40, height: 40, fontSize: 18 }}><MessageSquare size={18} /></div>
                <button type="button" className="row-body" style={{ textAlign: 'left' }} onClick={() => startChat({ id: chat.id, messages: chat.messages, createdAt: chat.createdAt })}>
                  <div className="row-title">{chat.title}</div>
                  <div className="row-sub">
                    <span>{new Date(chat.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>·<span>{chat.messages.length} messages</span>
                  </div>
                </button>
                <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => storage.deleteChat(chat.id)} aria-label="Delete conversation"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
          {!shown.length && <div className="empty">No conversations match “{query}”.</div>}
        </>
      )}
    </div>
  );
};

export default History;
