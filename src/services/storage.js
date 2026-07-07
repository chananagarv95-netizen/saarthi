// localStorage-backed chat history persistence
const STORAGE_KEY = 'saarthi_chats';
const PROFILE_KEY = 'saarthi_profile';

export const storage = {
  getChats: () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } 
    catch { return []; }
  },
  saveChat: (chat) => {
    const chats = storage.getChats();
    const idx = chats.findIndex(c => c.sessionId === chat.sessionId);
    if (idx >= 0) chats[idx] = chat;
    else chats.unshift(chat);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 50))); // keep last 50
  },
  deleteChat: (sessionId) => {
    const chats = storage.getChats().filter(c => c.sessionId !== sessionId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  },
  getProfile: () => {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); }
    catch { return null; }
  },
  saveProfile: (profile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
};
