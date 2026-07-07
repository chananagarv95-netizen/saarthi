const { processIntent } = require('../services/groqService');
const { createSession, getSession, addMessage } = require('../services/memoryService');

const handleChat = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create session
    let session = sessionId ? getSession(sessionId) : null;
    if (!session) session = createSession();

    // Save user message
    addMessage(session.sessionId, { role: 'user', content: message });

    // Process with AI
    const aiResponse = await processIntent(message);

    // Save AI response
    addMessage(session.sessionId, {
      role: 'assistant',
      content: aiResponse.reply,
      workflow: aiResponse.workflow,
      metadata: aiResponse
    });

    return res.json({ ...aiResponse, sessionId: session.sessionId });
  } catch (error) {
    next(error);
  }
};

module.exports = { handleChat };
