const analyticsRoutes = require('../../src/routes/analyticsRoutes');
const authMiddleware = require('../../src/middleware/authMiddleware');

// Apply auth middleware for analytics routes
module.exports = (req, res) => {
  return authMiddleware.requireAuth(req, res, () => {
    return analyticsRoutes(req, res);
  });
}; 