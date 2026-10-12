// Local-first persistence: chats, profile and tracker never leave the device
// (except the profile fields sent along with a question to personalise answers).
import { useSyncExternalStore } from 'react';

const KEYS = { chats: 'saarthi_chats', profile: 'saarthi_profile', tracker: 'saarthi_tracker', vault: 'saarthi_vault', letters: 'saarthi_letters' };

export const DEFAULT_PROFILE = { name: '', age: '', gender: '', state: '', occupation: '', income: '', category: '', disability: false, language: 'English' };

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};

const listeners = new Set();
const cache = {};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked: keep in memory */ }
  cache[key] = value;
  listeners.forEach((l) => l());
};
const get = (key, fallback) => {
  if (!(key in cache)) cache[key] = read(key, fallback);
  return cache[key];
};

export const storage = {
  getChats: () => get(KEYS.chats, []),
  saveChat: (chat) => {
    const others = storage.getChats().filter((c) => c.id !== chat.id);
    write(KEYS.chats, [chat, ...others].slice(0, 50));
  },
  deleteChat: (id) => write(KEYS.chats, storage.getChats().filter((c) => c.id !== id)),

  getProfile: () => ({ ...DEFAULT_PROFILE, ...get(KEYS.profile, {}) }),
  saveProfile: (profile) => write(KEYS.profile, profile),

  getTracker: () => get(KEYS.tracker, []),
  saveTracker: (items) => write(KEYS.tracker, items),
  addTrackerItem: (item) => storage.saveTracker([{ id: crypto.randomUUID(), done: false, createdAt: new Date().toISOString(), ...item }, ...storage.getTracker()]),

  getVault: () => get(KEYS.vault, []),
  saveToVault: (doc) => write(KEYS.vault, [{ id: crypto.randomUUID(), savedAt: new Date().toISOString(), ...doc }, ...storage.getVault()].slice(0, 100)),
  removeFromVault: (id) => write(KEYS.vault, storage.getVault().filter((d) => d.id !== id)),

  getLetters: () => get(KEYS.letters, []),
  saveLetter: (letter) => write(KEYS.letters, [{ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...letter }, ...storage.getLetters()].slice(0, 30)),
  removeLetter: (id) => write(KEYS.letters, storage.getLetters().filter((l) => l.id !== id)),

  clearAll: () => { Object.values(KEYS).forEach((k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } delete cache[k]; }); listeners.forEach((l) => l()); }
};

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

// React hooks that re-render whenever the stored value changes (any page).
export const useProfile = () => useSyncExternalStore(subscribe, () => get(KEYS.profile, {}));
export const useTracker = () => useSyncExternalStore(subscribe, storage.getTracker);
export const useChats = () => useSyncExternalStore(subscribe, storage.getChats);
export const useVault = () => useSyncExternalStore(subscribe, storage.getVault);
export const useLetters = () => useSyncExternalStore(subscribe, storage.getLetters);

export const LANGUAGES = {
  English: 'en-IN', Hindi: 'hi-IN', Bengali: 'bn-IN', Marathi: 'mr-IN', Telugu: 'te-IN', Tamil: 'ta-IN', Gujarati: 'gu-IN',
  Urdu: 'ur-IN', Kannada: 'kn-IN', Odia: 'or-IN', Malayalam: 'ml-IN', Punjabi: 'pa-IN', Assamese: 'as-IN'
};
export const speechLang = (language) => LANGUAGES[language] || 'en-IN';
