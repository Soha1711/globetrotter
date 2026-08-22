const express = require('express');
const { createTrip, getUserTrips, getTripById } = require('../controllers/trip.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// All trip routes are protected
router.use(authenticateToken);

router.get('/', getUserTrips);
router.post('/', createTrip);
router.get('/:id', getTripById);

module.exports = router;
