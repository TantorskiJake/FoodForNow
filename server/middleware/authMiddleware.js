// server/middleware/authMiddleware.js

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

module.exports = isAuthenticated;
