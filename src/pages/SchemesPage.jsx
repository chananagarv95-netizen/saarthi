import { useEffect, useState } from 'react';
import { ExternalLink, MessageCircle, Sparkles, Loader, Info } from 'lucide-react';
import { api } from '../services/api';
import { storage, DEFAULT_PROFILE, useProfile } from '../services/storage';
import { ProfileFields } from './ProfilePage';
import './SchemesPage.css';

const SchemesPage = ({ onAsk }) => {
  const stored = useProfile();
  const [profile, setProfile] = useState(() => ({ ...DEFAULT_PROFILE, ...stored }));
  const [result, setResult] = useState(null);
  const [state, setState] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');

  const ready = profile.age !== '' && profile.occupation;

  const find = async (p = profile) => {
    setState('loading');
    try {
      setResult(await api.schemes(p));
      setState('idle');
    } catch (e) {
      setError(e.message);
      setState('error');
    }
  };

  // Returning users with a saved profile see their matches immediately.
  useEffect(() => {
    if (stored.age && stored.occupation) find({ ...DEFAULT_PROFILE, ...stored });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) => {
    e.preventDefault();
    storage.saveProfile(profile);
    find(profile);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Scheme finder</h1>
        <p className="page-subtitle">Discover government benefits you may be eligible for — in seconds.</p>
      </div>

      <form className="scheme-form" onSubmit={submit}>
        <ProfileFields profile={profile} set={(patch) => setProfile((p) => ({ ...p, ...patch }))} compact />
        <button type="submit" className="save-btn" disabled={!ready || state === 'loading'}>
          {state === 'loading' ? <><Loader size={16} className="spin-sm" /> Matching…</> : <><Sparkles size={16} /> {result ? 'Update matches' : 'Find my schemes'}</>}
        </button>
        {!ready && <p className="field-hint">Age and occupation are required; the rest improves accuracy.</p>}
      </form>

      {state === 'error' && <div className="error-banner">{error}</div>}

      {result && (
        <section className="scheme-results" aria-live="polite">
          <h2 className="section-title">{result.total ? `${result.total} schemes you may qualify for` : 'No matches yet'}</h2>
          {result.total === 0 && <p className="empty-hint">Try adding your income or category, or ask the assistant about your situation.</p>}
          <div className="scheme-grid">
            {result.schemes.map((s) => (
              <article key={s.id} className="scheme-card">
                <h3>{s.name}</h3>
                <p className="scheme-benefit">{s.benefit}</p>
                <p className="scheme-reason">{s.reason}</p>
                <div className="widget-actions">
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="widget-btn primary"><ExternalLink size={14} /> Apply</a>
                  <button type="button" className="widget-btn secondary" onClick={() => onAsk(`Am I eligible for ${s.name} and how do I apply step by step?`)}><MessageCircle size={14} /> Ask SAARTHI</button>
                </div>
              </article>
            ))}
          </div>
          <p className="doc-disclaimer"><Info size={12} /> Indicative screening based on published criteria (reviewed {result.reviewed}). Final eligibility is decided by the department — always confirm on the official portal.</p>
        </section>
      )}
    </div>
  );
};

export default SchemesPage;
