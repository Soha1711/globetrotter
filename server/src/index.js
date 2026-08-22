const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const cityRoutes = require('./routes/city.routes');
const tripRoutes = require('./routes/trip.routes');
const stopRoutes = require('./routes/stop.routes');
const { errorHandler } = require('./middleware/error.middleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/stops', stopRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to GlobeTrotter API Server',
    endpoints: {
      health: 'GET /api/health',
      auth: { register: 'POST /api/auth/register', login: 'POST /api/auth/login', me: 'GET /api/auth/me' },
      cities: { list: 'GET /api/cities', detail: 'GET /api/cities/:id', activities: 'GET /api/cities/:id/activities' },
      trips: { list: 'GET /api/trips', create: 'POST /api/trips', detail: 'GET /api/trips/:id', addStop: 'POST /api/trips/:tripId/stops', updateStop: 'PUT /api/trips/:tripId/stops/:stopId', deleteStop: 'DELETE /api/trips/:tripId/stops/:stopId' },
      stops: { addActivity: 'POST /api/stops/:stopId/activities', removeActivity: 'DELETE /api/stops/:stopId/activities/:activityId' }
    }
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[GlobeTrotter API] Server running on http://localhost:${PORT}`);
});

module.exports = app;
