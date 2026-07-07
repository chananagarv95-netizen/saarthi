// In-memory store for demo (production would use a database)
const { v4: uuidv4 } = require('uuid');

const sessions = {};

const createSession = (userId = 'default') => {
  const sessionId = uuidv4();
  sessions[sessionId] = { sessionId, userId, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  return sessions[sessionId];
};

const getSession = (sessionId) => sessions[sessionId] || null;

const getAllSessions = (userId = 'default') => {
  return Object.values(sessions).filter(s => s.userId === userId).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

const addMessage = (sessionId, message) => {
  if (!sessions[sessionId]) return null;
  const msg = { id: uuidv4(), ...message, timestamp: new Date().toISOString() };
  sessions[sessionId].messages.push(msg);
  sessions[sessionId].updatedAt = new Date().toISOString();
  // Auto-generate session title from first user message
  if (!sessions[sessionId].title && message.role === 'user') {
    sessions[sessionId].title = message.content.slice(0, 60);
  }
  return msg;
};

const deleteSession = (sessionId) => {
  if (sessions[sessionId]) { delete sessions[sessionId]; return true; }
  return false;
};

module.exports = { createSession, getSession, getAllSessions, addMessage, deleteSession };
