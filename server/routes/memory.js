const express = require('express');
const router = express.Router();
const { getMemory, getSessionById, clearMemory } = require('../controllers/memoryController');

router.get('/', getMemory);
router.get('/:id', getSessionById);
router.delete('/:id', clearMemory);

module.exports = router;
