const express = require('express');
const { getActivities } = require('../controllers/activity.controller');

const router = express.Router();

// All activity routes are public
router.get('/', getActivities);

module.exports = router;