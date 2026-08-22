const express = require('express');
const { register, login, getMe } = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);

// Protected user profile endpoint
router.get('/me', authenticateToken, getMe);

module.exports = router;
