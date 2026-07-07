const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const chatRoutes = require('./routes/chat');
const workflowRoutes = require('./routes/workflow');
const memoryRoutes = require('./routes/memory');
const documentRoutes = require('./routes/document');
const timelineRoutes = require('./routes/timeline');

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet({ crossOriginResourcePolicy: false }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Logging
app.use(morgan('dev'));

// CORS
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/timeline', timelineRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', version: '2.0.0' }));

// Central error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

const server = app.listen(PORT, () => {
  console.log(`✓ SAARTHI Backend v2.0 running on port ${PORT}`);
});

module.exports = server;
