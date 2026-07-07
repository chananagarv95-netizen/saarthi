const express = require('express');
const router = express.Router();
const { handleWorkflow, handleEligibility } = require('../controllers/workflowController');

router.post('/', handleWorkflow);
router.post('/eligibility', handleEligibility);

module.exports = router;
