const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { processChat, processWorkflow, analyzeDocument } = require('./services/assistant');
const { matchSchemes, serviceDetail, WORKFLOWS, CATEGORIES, lastReviewed } = require('./services/catalog');
const { TYPES: DRAFT_TYPES, draftTypes, createDraft } = require('./services/drafts');
const { getProviders } = require('./services/llm');

const app = express();
const PORT = process.env.PORT || 3001;
const DIST = path.join(__dirname, '..', 'dist');

app.set('trust proxy', 1); // behind Render/Railway/Fly/NGINX: real client IP for rate limiting
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Same-origin in production (Express serves the built frontend). CORS only matters
// when the frontend is hosted elsewhere: list its origin(s) in CORS_ORIGIN.
const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((s) => s.trim());
app.use('/api', cors({ origin: allowed }));
app.use(express.json({ limit: '200kb' }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: Number(process.env.RATE_LIMIT) || 150, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests, please try again in a few minutes.' } });
app.use('/api', apiLimiter);

// ── validation at the trust boundary ────────────────────────────────────────
const badRequest = (res, error) => res.status(400).json({ error });
const asProfile = (p) => (p && typeof p === 'object' && !Array.isArray(p) ? p : {});

app.get('/api/health', (req, res) => {
  const providers = getProviders().map((p) => p.name);
  res.json({ status: 'ok', version: '3.0.0', ai: providers.length ? 'online' : 'offline', providers, catalogReviewed: lastReviewed });
});

app.post('/api/chat', async (req, res, next) => {
  try {
    const { message, history, profile } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) return badRequest(res, 'Message is required');
    if (message.length > 2000) return badRequest(res, 'Message is too long (max 2000 characters)');
    const safeHistory = Array.isArray(history) ? history.filter((m) => m && typeof m.content === 'string').slice(-8) : [];
    res.json(await processChat({ message: message.trim(), history: safeHistory, profile: asProfile(profile) }));
  } catch (e) { next(e); }
});

app.post('/api/workflow', async (req, res, next) => {
  try {
    const { workflow, context, profile } = req.body || {};
    if (!WORKFLOWS.includes(String(workflow).toUpperCase())) return badRequest(res, 'Unknown workflow');
    res.json(await processWorkflow({ workflow, context: typeof context === 'string' ? context : '', profile: asProfile(profile) }));
  } catch (e) { next(e); }
});

app.get('/api/services', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({ categories: CATEGORIES.map(({ id, label }) => ({ id, label })), services: WORKFLOWS.filter((w) => w !== 'GENERAL').map(serviceDetail) });
});

app.get('/api/drafts/types', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({ types: draftTypes() });
});

app.post('/api/drafts', async (req, res, next) => {
  try {
    const { type, details, profile } = req.body || {};
    if (!DRAFT_TYPES[type]) return badRequest(res, 'Unknown letter type');
    if (!details || typeof details !== 'object' || Array.isArray(details)) return badRequest(res, 'Details are required');
    res.json(await createDraft({ type, details, profile: asProfile(profile) }));
  } catch (e) { next(e); }
});

app.post('/api/schemes', (req, res) => {
  const schemes = matchSchemes(asProfile(req.body?.profile));
  res.json({ schemes, total: schemes.length, reviewed: lastReviewed });
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const upload = multer({
  storage: multer.memoryStorage(), // never written to disk: citizen documents are sensitive
  limits: { fileSize: 4 * 1024 * 1024, files: 1 }, // serverless hosts cap bodies at ~4.5 MB; the client compresses photos
  fileFilter: (req, file, cb) => (ALLOWED_TYPES.includes(file.mimetype)
    ? cb(null, true)
    : cb(Object.assign(new Error('Unsupported file type. Use PDF, JPG, PNG or WEBP.'), { status: 400 })))
});
const docLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: Number(process.env.DOC_RATE_LIMIT) || 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many document uploads. Please wait a few minutes.' } });

app.post('/api/document/analyze', docLimiter, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return badRequest(res, 'No file uploaded');
    let profile = {};
    try { profile = asProfile(JSON.parse(req.body?.profile || '{}')); } catch { /* ignore bad profile */ }
    const analysis = await analyzeDocument({ buffer: req.file.buffer, mimeType: req.file.mimetype, filename: req.file.originalname.slice(0, 120), profile });
    res.json({ filename: req.file.originalname, fileSize: req.file.size, analysis, analyzedAt: new Date().toISOString() });
  } catch (e) { next(e); }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ── frontend (production build) ─────────────────────────────────────────────
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { maxAge: '1y', index: false, setHeaders: (res, file) => { if (file.endsWith('.html') || file.endsWith('.webmanifest')) res.setHeader('Cache-Control', 'no-cache'); } }));
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(DIST, 'index.html'), { headers: { 'Cache-Control': 'no-cache' } }));
}

// ── errors ──────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  if (err.code === 'LIMIT_FILE_SIZE') err.message = 'File is too large. Please upload a file under 4 MB.';
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message });
});

if (require.main === module) {
  app.listen(PORT, () => {
    const providers = getProviders().map((p) => p.name);
    console.log(`✓ SAARTHI v3 on http://localhost:${PORT} — AI: ${providers.length ? providers.join(' → ') : 'offline mode (no API key set)'}`);
  });
}

module.exports = app;
