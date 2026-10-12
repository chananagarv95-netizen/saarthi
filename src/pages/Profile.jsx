import { useState } from 'react';
import { Save, Check, Lock, Trash2 } from 'lucide-react';
import { storage, DEFAULT_PROFILE, LANGUAGES, useProfile } from '../services/storage';

const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];
const OCCUPATIONS = { student: 'Student', farmer: 'Farmer', salaried: 'Salaried employee', self_employed: 'Self-employed / business', unorganised_worker: 'Daily wage / unorganised worker', street_vendor: 'Street vendor', artisan: 'Artisan / craftsperson', unemployed: 'Looking for work', homemaker: 'Homemaker', retired: 'Retired' };
const GENDERS = { female: 'Female', male: 'Male', other: 'Other' };
const CATEGORIES = { general: 'General', obc: 'OBC', sc: 'SC', st: 'ST', ews: 'EWS' };

const Select = ({ label, value, onChange, options }) => (
  <label className="field">
    <span className="field-label">{label}</span>
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select</option>
      {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  </label>
);

// Shared with the Scheme finder.
export const ProfileFields = ({ profile, set, withName = false }) => (
  <div className="form-grid">
    {withName && (
      <label className="field span-2">
        <span className="field-label">Name</span>
        <input className="input" value={profile.name} onChange={(e) => set({ name: e.target.value })} maxLength={80} placeholder="What should SAARTHI call you?" autoComplete="given-name" />
      </label>
    )}
    <label className="field">
      <span className="field-label">Age</span>
      <input className="input" type="number" inputMode="numeric" min="0" max="120" value={profile.age} onChange={(e) => set({ age: e.target.value })} placeholder="e.g. 24" />
    </label>
    <Select label="Occupation" value={profile.occupation} onChange={(v) => set({ occupation: v })} options={OCCUPATIONS} />
    <label className="field">
      <span className="field-label">Annual family income (₹)</span>
      <input className="input" type="number" inputMode="numeric" min="0" step="10000" value={profile.income} onChange={(e) => set({ income: e.target.value })} placeholder="e.g. 180000" />
    </label>
    <Select label="Gender" value={profile.gender} onChange={(v) => set({ gender: v })} options={GENDERS} />
    <Select label="Category" value={profile.category} onChange={(v) => set({ category: v })} options={CATEGORIES} />
    <Select label="State" value={profile.state} onChange={(v) => set({ state: v })} options={Object.fromEntries(STATES.map((s) => [s, s]))} />
    <label className="check span-2"><input type="checkbox" checked={!!profile.disability} onChange={(e) => set({ disability: e.target.checked })} /> I have a certified disability</label>
  </div>
);

const Profile = () => {
  const stored = useProfile();
  const [profile, setProfile] = useState(() => ({ ...DEFAULT_PROFILE, ...stored }));
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const set = (patch) => { setProfile((p) => ({ ...p, ...patch })); setSaved(false); };
  const initials = profile.name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '🙂';

  return (
    <div className="content narrow page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-sub">Personalises answers, language and scheme matches. Everything is optional and stays on this device.</p>
        </div>
      </div>

      <form className="card pad-lg" onSubmit={(e) => { e.preventDefault(); storage.saveProfile(profile); setSaved(true); }}>
        <div className="profile-head">
          <div className="profile-avatar">{initials}</div>
          <div>
            <h2 style={{ fontSize: 22 }}>{profile.name || 'Citizen'}</h2>
            <span className="badge info"><Lock size={11} /> Stored only on this device</span>
          </div>
        </div>

        <label className="field" style={{ marginBottom: 20 }}>
          <span className="field-label">Answer me in</span>
          <select className="select" value={profile.language} onChange={(e) => set({ language: e.target.value })}>
            {Object.keys(LANGUAGES).map((l) => <option key={l}>{l}</option>)}
          </select>
          <span className="field-hint">Replies, letters, voice input and read-aloud use this language.</span>
        </label>

        <ProfileFields profile={profile} set={set} withName />

        <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: 24 }}>
          {saved ? <><Check size={17} /> Saved</> : <><Save size={17} /> Save profile</>}
        </button>
      </form>

      <div className="card danger-zone" style={{ marginTop: 18 }}>
        <div>
          <strong>Delete all my data</strong>
          <p className="small muted">Removes profile, chats, tracker, vault and letters from this device.</p>
        </div>
        {confirmClear ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => { storage.clearAll(); try { localStorage.removeItem('saarthi_contact'); } catch { /* ignore */ } setProfile({ ...DEFAULT_PROFILE }); setConfirmClear(false); }}>Yes, delete everything</button>
            <button type="button" className="btn btn-sm" onClick={() => setConfirmClear(false)}>Cancel</button>
          </div>
        ) : (
          <button type="button" className="btn btn-sm" onClick={() => setConfirmClear(true)}><Trash2 size={14} /> Delete</button>
        )}
      </div>
    </div>
  );
};

export default Profile;
