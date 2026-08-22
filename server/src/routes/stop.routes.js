const express = require('express');
const { addStopActivity, removeStopActivity } = require('../controllers/stop.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// All stop-level routes are protected
router.use(authenticateToken);

router.post('/:stopId/activities', addStopActivity);
router.delete('/:stopId/activities/:activityId', removeStopActivity);

module.exports = router;
