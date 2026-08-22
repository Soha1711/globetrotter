const express = require('express');
const { getCities, getCityById } = require('../controllers/city.controller');

const router = express.Router();

router.get('/', getCities);
router.get('/:id', getCityById);

module.exports = router;
