import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ExternalLink, MessageCircle, Sparkles, Info } from 'lucide-react';
import { api } from '../services/api';
import { storage, DEFAULT_PROFILE, useProfile } from '../services/storage';
import { ProfileFields } from './Profile';

const Schemes = () => {
  const { startChat } = useOutletContext();
  const stored = useProfile();
  const [profile, setProfile] = useState(() => ({ ...DEFAULT_PROFILE, ...stored }));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const ready = profile.age !== '' && profile.occupation;

  const find = async (p) => {
    setLoading(true);
    setError('');
    try { setResult(await api.schemes(p)); } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (stored.age && stored.occupation) find({ ...DEFAULT_PROFILE, ...stored });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="content page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Scheme finder</h1>
          <p className="page-sub">Discover central government benefits you may qualify for — instantly, without sharing anything off your device except these answers.</p>
        </div>
      </div>

      <form className="card pad-lg" onSubmit={(e) => { e.preventDefault(); storage.saveProfile({ ...DEFAULT_PROFILE, ...stored, ...profile }); find(profile); }}>
        <ProfileFields profile={profile} set={(patch) => setProfile((p) => ({ ...p, ...patch }))} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={!ready || loading}>
            {loading ? <><span className="spinner" /> Matching…</> : <><Sparkles size={17} /> {result ? 'Update matches' : 'Find my schemes'}</>}
          </button>
          {!ready && <span className="field-hint">Age and occupation are required; the rest improves accuracy.</span>}
        </div>
      </form>

      {error && <div className="notice bad" style={{ marginTop: 16 }}>{error}</div>}

      {result && (
        <section className="section" aria-live="polite">
          <div className="section-head">
            <h2 className="section-title">{result.total ? <><span className="gradient-text">{result.total}</span> schemes you may qualify for</> : 'No matches yet'}</h2>
          </div>
          {result.total === 0 && <div className="empty">Try adding income or category — or describe your situation to the assistant.</div>}
          <div className="scheme-grid">
            {result.schemes.map((s, i) => (
              <article key={s.id} className="card hoverable scheme lift" style={{ animation: `fade-up 0.5s ${i * 0.04}s var(--ease) both` }}>
                <span className="accent-bar" />
                <h3>{s.name}</h3>
                <div className="benefit gradient-text">{s.benefit}</div>
                <p className="reason">{s.reason}</p>
                <div className="svc-actions" style={{ marginTop: 8 }}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm"><ExternalLink size={14} /> Apply</a>
                  <button type="button" className="btn btn-sm" onClick={() => startChat({ text: `Am I eligible for ${s.name} and how do I apply step by step?` })}><MessageCircle size={14} /> Ask</button>
                </div>
              </article>
            ))}
          </div>
          <p className="tiny dim" style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 16 }}><Info size={12} /> Indicative screening on published criteria (reviewed {result.reviewed}). The department decides final eligibility — confirm on the official portal.</p>
        </section>
      )}
    </div>
  );
};

export default Schemes;
