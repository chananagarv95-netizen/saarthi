import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { User, MapPin, Globe, Save, Check } from 'lucide-react';
import './ProfilePage.css';

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry'];
const LANGUAGES = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Gujarati','Punjabi','Odia','Assamese','Urdu'];

const DEFAULT_PROFILE = { name: 'Garv Chanana', state: 'Delhi', language: 'English', aadhaarLinked: true, mobileVerified: true, emailVerified: false };

const ProfilePage = () => {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const stored = storage.getProfile();
    if (stored) setProfile(stored);
  }, []);

  const handleSave = () => {
    storage.saveProfile(profile);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const initials = profile.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'GC';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Your Profile</h1>
        <p className="page-subtitle">Personal information and preferences</p>
      </div>

      <div className="profile-card">
        <div className="profile-hero">
          <div className="profile-avatar">{initials}</div>
          <div>
            <h2 className="profile-name">{profile.name}</h2>
            <div className="profile-badges">
              {profile.aadhaarLinked && <span className="badge verified">✓ Aadhaar Linked</span>}
              {profile.mobileVerified && <span className="badge verified">✓ Mobile Verified</span>}
              {!profile.emailVerified && <span className="badge pending">Email not verified</span>}
            </div>
          </div>
          <button className="edit-btn" onClick={() => setEditing(e => !e)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="profile-fields">
          <div className="field-group">
            <label className="field-label"><User size={14} /> Full Name</label>
            <input className={`field-input ${editing ? 'editable' : ''}`} value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} readOnly={!editing} />
          </div>
          <div className="field-group">
            <label className="field-label"><MapPin size={14} /> State</label>
            {editing ? (
              <select className="field-input editable" value={profile.state} onChange={e => setProfile(p => ({...p, state: e.target.value}))}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            ) : (
              <input className="field-input" value={profile.state} readOnly />
            )}
          </div>
          <div className="field-group">
            <label className="field-label"><Globe size={14} /> Preferred Language</label>
            {editing ? (
              <select className="field-input editable" value={profile.language} onChange={e => setProfile(p => ({...p, language: e.target.value}))}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            ) : (
              <input className="field-input" value={profile.language} readOnly />
            )}
          </div>
        </div>

        {editing && (
          <button className={`save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
            {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
          </button>
        )}
      </div>

      <div className="pref-section">
        <h3 className="section-label">Saved Preferences</h3>
        <div className="pref-grid">
          {['Aadhaar Services', 'Scholarship', 'Agriculture'].map(pref => (
            <div key={pref} className="pref-chip">⭐ {pref}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
