const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const healthRoutes = require('./routes/health.routes');
const { errorHandler } = require('./middleware/error.middleware');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for local dev
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', healthRoutes);

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to GlobeTrotter API Server',
    healthCheck: '/api/health'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`[GlobeTrotter API] Server running on http://localhost:${PORT}`);
});

module.exports = app;
