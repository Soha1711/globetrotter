const express = require('express');
const { getCities, getCityById, getCityActivities } = require('../controllers/city.controller');

const router = express.Router();

router.get('/', getCities);
router.get('/:id/activities', getCityActivities);
router.get('/:id', getCityById);

module.exports = router;
