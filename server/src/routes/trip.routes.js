const express = require('express');
const { createTrip, getUserTrips, getTripById, getTripBudget, updateTripBudget } = require('../controllers/trip.controller');
const { createStop, updateStop, deleteStop } = require('../controllers/stop.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// All trip routes are protected
router.use(authenticateToken);

router.get('/', getUserTrips);
router.post('/', createTrip);
router.get('/:tripId', getTripById);
router.get('/:tripId/budget', getTripBudget);
router.put('/:tripId/budget', updateTripBudget);

// Nested stop management
router.post('/:tripId/stops', createStop);
router.put('/:tripId/stops/:stopId', updateStop);
router.delete('/:tripId/stops/:stopId', deleteStop);

module.exports = router;
