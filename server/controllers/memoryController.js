const { getAllSessions, getSession, createSession, deleteSession } = require('../services/memoryService');

const getMemory = (req, res) => {
  const sessions = getAllSessions('default');
  res.json({ sessions, total: sessions.length });
};

const getSessionById = (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
};

const clearMemory = (req, res) => {
  const { id } = req.params;
  const deleted = deleteSession(id);
  if (!deleted) return res.status(404).json({ error: 'Session not found' });
  res.json({ success: true });
};

module.exports = { getMemory, getSessionById, clearMemory };
