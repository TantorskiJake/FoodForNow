const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  console.log('Auth middleware - Request headers:', req.headers);
  
  // Get token from header
  const authHeader = req.header('Authorization');
  console.log('Auth header:', authHeader);
  
  if (!authHeader) {
    console.log('No Authorization header found');
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  // Check if header has Bearer token
  if (!authHeader.startsWith('Bearer ')) {
    console.log('Invalid token format - missing Bearer prefix');
    return res.status(401).json({ error: 'Invalid token format' });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('Extracted token:', token.substring(0, 10) + '...');

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    console.log('Token payload:', JSON.stringify(decoded, null, 2));
    
    // Add user ID from payload
    req.user = { id: decoded.userId };
    console.log('User authenticated:', req.user.id);
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ error: 'Token is not valid' });
  }
}; 