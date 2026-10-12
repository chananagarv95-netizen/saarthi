import { useState } from 'react';
import { Save, Check, Lock, Trash2 } from 'lucide-react';
import { storage, DEFAULT_PROFILE, LANGUAGES, useProfile } from '../services/storage';
import './ProfilePage.css';

const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman & Nicobar', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];
const OCCUPATIONS = { student: 'Student', farmer: 'Farmer', salaried: 'Salaried employee', self_employed: 'Self-employed / business', unorganised_worker: 'Daily wage / unorganised worker', street_vendor: 'Street vendor', artisan: 'Artisan / craftsperson', unemployed: 'Looking for work', homemaker: 'Homemaker', retired: 'Retired' };
const GENDERS = { female: 'Female', male: 'Male', other: 'Other' };
const CATEGORIES = { general: 'General', obc: 'OBC', sc: 'SC', st: 'ST', ews: 'EWS' };

const Select = ({ label, value, onChange, options, placeholder = 'Select' }) => (
  <label className="field-group">
    <span className="field-label">{label}</span>
    <select className="field-input editable" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  </label>
);

// Shared by the Profile page and the Scheme finder.
export const ProfileFields = ({ profile, set, compact = false }) => (
  <div className={`profile-fields ${compact ? 'compact' : ''}`}>
    {!compact && (
      <label className="field-group">
        <span className="field-label">Name</span>
        <input className="field-input editable" value={profile.name} onChange={(e) => set({ name: e.target.value })} maxLength={80} placeholder="What should SAARTHI call you?" autoComplete="given-name" />
      </label>
    )}
    <label className="field-group">
      <span className="field-label">Age</span>
      <input className="field-input editable" type="number" inputMode="numeric" min="0" max="120" value={profile.age} onChange={(e) => set({ age: e.target.value })} placeholder="e.g. 24" />
    </label>
    <Select label="Occupation" value={profile.occupation} onChange={(v) => set({ occupation: v })} options={OCCUPATIONS} />
    <label className="field-group">
      <span className="field-label">Annual family income (₹)</span>
      <input className="field-input editable" type="number" inputMode="numeric" min="0" step="10000" value={profile.income} onChange={(e) => set({ income: e.target.value })} placeholder="e.g. 180000" />
    </label>
    <Select label="Gender" value={profile.gender} onChange={(v) => set({ gender: v })} options={GENDERS} />
    <Select label="Category" value={profile.category} onChange={(v) => set({ category: v })} options={CATEGORIES} />
    <Select label="State" value={profile.state} onChange={(v) => set({ state: v })} options={Object.fromEntries(STATES.map((s) => [s, s]))} />
    <label className="field-check">
      <input type="checkbox" checked={!!profile.disability} onChange={(e) => set({ disability: e.target.checked })} />
      <span>I have a certified disability</span>
    </label>
  </div>
);

const ProfilePage = () => {
  const stored = useProfile();
  const [profile, setProfile] = useState(() => ({ ...DEFAULT_PROFILE, ...stored }));
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const set = (patch) => { setProfile((p) => ({ ...p, ...patch })); setSaved(false); };

  const save = (e) => {
    e.preventDefault();
    storage.saveProfile(profile);
    setSaved(true);
  };

  const clearAll = () => {
    storage.clearAll();
    setProfile({ ...DEFAULT_PROFILE });
    setConfirmClear(false);
  };

  const initials = profile.name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '🙂';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Your profile</h1>
        <p className="page-subtitle">Used to personalise answers and match schemes. Everything is optional.</p>
      </div>

      <form className="profile-card" onSubmit={save}>
        <div className="profile-hero">
          <div className="profile-avatar">{initials}</div>
          <div>
            <h2 className="profile-name">{profile.name || 'Citizen'}</h2>
            <div className="profile-badges"><span className="badge"><Lock size={11} /> Stored only on this device</span></div>
          </div>
        </div>

        <label className="field-group language-field">
          <span className="field-label">Answer me in</span>
          <select className="field-input editable" value={profile.language} onChange={(e) => set({ language: e.target.value })}>
            {Object.keys(LANGUAGES).map((l) => <option key={l}>{l}</option>)}
          </select>
          <span className="field-hint">Voice input and read-aloud use this language too.</span>
        </label>

        <ProfileFields profile={profile} set={set} />

        <button type="submit" className={`save-btn ${saved ? 'saved' : ''}`}>
          {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save profile</>}
        </button>
      </form>

      <div className="danger-zone">
        <div>
          <strong>Delete all my data</strong>
          <p>Removes your profile, chat history and tracker from this device.</p>
        </div>
        {confirmClear ? (
          <div className="danger-actions">
            <button type="button" className="widget-btn danger" onClick={clearAll}>Yes, delete everything</button>
            <button type="button" className="widget-btn secondary" onClick={() => setConfirmClear(false)}>Cancel</button>
          </div>
        ) : (
          <button type="button" className="widget-btn secondary" onClick={() => setConfirmClear(true)}><Trash2 size={14} /> Delete</button>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
