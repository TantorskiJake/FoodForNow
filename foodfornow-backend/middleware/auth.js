const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'Please login' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded:', decoded);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('User not found:', decoded.userId);
      return res.status(401).json({ error: 'User no longer exists' });
    }

    // Add user to request
    req.userId = user._id;
    console.log('User authenticated:', req.userId);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Please login' });
  }
};

module.exports = auth;