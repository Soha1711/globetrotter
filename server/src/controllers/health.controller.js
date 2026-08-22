/**
 * Health check controller
 * GET /api/health
 */
const getHealthStatus = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'GlobeTrotter API is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
};

module.exports = {
  getHealthStatus
};
