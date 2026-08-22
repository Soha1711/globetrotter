const express = require('express');
const { getAdminUsers, getPopularCities, getPopularActivities, getTrends } = require('../controllers/trip.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');

const router = express.Router();

// All admin routes require authentication + ADMIN role
router.use(authenticateToken, authorizeRole('ADMIN'));

router.get('/users', getAdminUsers);
router.get('/analytics/popular-cities', getPopularCities);
router.get('/analytics/popular-activities', getPopularActivities);
router.get('/analytics/trends', getTrends);

module.exports = router;