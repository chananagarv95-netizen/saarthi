const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeDocument } = require('../services/groqService');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Accepted: PDF, JPG, PNG, WEBP'), false);
  }
});

const handleDocumentUpload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const file = req.file;
    const fileBuffer = fs.readFileSync(file.path);
    const base64Data = fileBuffer.toString('base64');

    const analysis = await analyzeDocument(base64Data, file.mimetype, file.originalname);

    // Clean up temp file
    fs.unlinkSync(file.path);

    return res.json({
      success: true,
      filename: file.originalname,
      fileSize: file.size,
      analysis,
      uploadedAt: new Date().toISOString()
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
};

module.exports = { upload, handleDocumentUpload };
