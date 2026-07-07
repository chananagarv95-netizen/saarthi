const express = require('express');
const router = express.Router();
const { getTimeline, addTimelineEvent } = require('../services/timelineService');

router.get('/', (req, res) => {
  res.json({ events: getTimeline(), retrievedAt: new Date().toISOString() });
});

router.post('/', (req, res) => {
  const event = addTimelineEvent(req.body);
  res.status(201).json(event);
});

module.exports = router;
