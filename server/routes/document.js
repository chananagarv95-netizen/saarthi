const express = require('express');
const router = express.Router();
const { upload, handleDocumentUpload } = require('../controllers/documentController');

router.post('/verify', upload.single('file'), handleDocumentUpload);
router.post('/analyze', upload.single('file'), handleDocumentUpload);

module.exports = router;
