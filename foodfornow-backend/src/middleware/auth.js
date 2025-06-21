const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Authentication Middleware
 * 
 * This middleware validates JWT tokens from HTTP-only cookies and
 * ensures the user is authenticated before allowing access to protected routes.
 * It extracts the user ID from the token and adds it to the request object.
 */

// JWT secret key from environment variables with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

/**
 * Authentication middleware function
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const auth = async (req, res, next) => {
  try {
    // Extract JWT token from HTTP-only cookie
    // Using optional chaining to safely access cookies
    const token = req.cookies?.accessToken;
    if (!token) {
      console.log('No accessToken cookie provided');
      return res.status(401).json({ error: 'Please login' });
    }

    // Verify the JWT token signature and decode payload
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded:', decoded);
    
    // Extract user ID from token payload
    // Handle both 'userId' and 'id' properties for compatibility
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      console.log('No user ID in token');
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Verify that the user still exists in the database
    // This prevents access with tokens for deleted users
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(401).json({ error: 'User no longer exists' });
    }

    // Add user ID to request object for use in route handlers
    req.userId = user._id;
    console.log('User authenticated:', req.userId);
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Handle specific JWT errors with appropriate responses
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    // Handle any other errors
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Export the authentication middleware
module.exports = auth;