const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const RefreshToken = require("../models/refreshToken");
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * Authentication Routes
 * 
 * This module handles user authentication including registration, login,
 * token refresh, and logout. It uses JWT tokens for secure authentication
 * and bcrypt for password hashing.
 */

// Token expiration durations for security
const ACCESS_TOKEN_EXPIRATION = "1h";  // Short-lived for security
const REFRESH_TOKEN_EXPIRATION = "7d"; // Longer-lived for convenience
const JWT_SECRET = process.env.JWT_SECRET;

// Validate that JWT secret is configured
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Calculate expiration time based on duration string
 * @param {string} duration - Duration string ('1h' or '7d')
 * @returns {Date} Expiration date
 */
const getExpirationTime = (duration) => {
  const ms = duration === "1h" ? 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 1 hour or 7 days
  return new Date(Date.now() + ms);
};

/**
 * Generate access and refresh tokens for a user
 * @param {string} userId - User ID to generate tokens for
 * @returns {Object} Object containing accessToken and refreshToken
 */
const generateTokens = async (userId) => {
  // Create short-lived access token
  const accessToken = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  });

  // Create long-lived refresh token
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
  });

  // Store refresh token in database for security
  const refreshTokenDoc = new RefreshToken({
    token: refreshToken,
    user: userId,
    expiresAt: getExpirationTime(REFRESH_TOKEN_EXPIRATION),
  });

  await refreshTokenDoc.save();

  return { accessToken, refreshToken };
};

// Cookie configuration for secure token storage
const cookieOptions = {
  httpOnly: true, // Prevent XSS attacks
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // CSRF protection
};

/**
 * POST /auth/register - Register a new user
 * 
 * Creates a new user account with hashed password and returns authentication tokens.
 * Validates input, checks for existing users, and enforces password strength.
 */
router.post('/register', async (req, res) => {
  try {
    console.log('Received registration request:', { ...req.body, password: '***' });
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Enforce minimum password length
    if (password.length < 8) {
      console.log('Password too short');
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Enforce strong password requirements
    // Must contain: lowercase, uppercase, digit, and special character
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      console.log('Weak password provided');
      return res.status(400).json({ error: 'Password is too weak' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email already registered:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password with bcrypt for security
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    console.log('User created successfully:', { id: user._id, email: user.email });

    // Generate authentication tokens
    const { accessToken, refreshToken } = await generateTokens(user._id);

    // Set secure HTTP-only cookies
    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 }); // 1h
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7d
    
    // Return user data (without password)
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /auth/login - Authenticate existing user
 * 
 * Validates user credentials and returns authentication tokens.
 * Compares password hash and generates new tokens for the session.
 */
router.post('/login', async (req, res) => {
  try {
    console.log('Received login request:', { email: req.body.email, password: '***' });
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log('Missing required fields:', { email: !!email, password: !!password });
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate new authentication tokens
    const { accessToken, refreshToken } = await generateTokens(user._id);

    // Set secure HTTP-only cookies
    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    // Return user data (without password)
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * GET /auth/me - Get current user information
 * 
 * Returns the current user's profile information.
 * Requires authentication middleware.
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: user.location,
        website: user.website,
        profilePicture: user.profilePicture,
        preferences: user.preferences,
        notifications: user.notifications,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

/**
 * POST /auth/token - Refresh access token
 * 
 * Uses refresh token to generate a new access token.
 * Validates refresh token and checks if it's been revoked.
 */
router.post("/token", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    // Verify refresh token exists in database and is not revoked
    const tokenDoc = await RefreshToken.findOne({ 
      token: refreshToken, 
      isRevoked: false,
      expiresAt: { $gt: new Date() } // Check if token hasn't expired
    });

    if (!tokenDoc) {
      return res.status(403).json({ error: "Invalid or expired refresh token" });
    }

    // Verify JWT signature to ensure token is valid
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Generate new tokens for the user
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(decoded.userId);

    // Revoke the old refresh token for security (one-time use)
    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    // Set new secure cookies
    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 60 * 60 * 1000 });
    res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * POST /auth/logout - Logout user
 * 
 * Clears authentication cookies to log out the user.
 * Note: This doesn't revoke the refresh token from the database.
 */
router.post("/logout", (req, res) => {
  // Clear authentication cookies
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.json({ success: true });
});

/**
 * PUT /auth/profile - Update user profile
 * 
 * Allows users to update their profile information including name, email, bio, location, website,
 * preferences, notifications, and password. Validates current password when changing password.
 */
router.put('/profile', auth, async (req, res) => {
  try {
    console.log('Profile update request body:', req.body);
    
    const { 
      name, 
      email, 
      bio, 
      location, 
      website, 
      profilePicture,
      preferences,
      notifications,
      currentPassword, 
      newPassword 
    } = req.body;
    
    console.log('Extracted fields:', { name, email, bio, location, website });
    
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update basic profile fields if provided
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio || null;
    if (location !== undefined) user.location = location || null;
    if (website !== undefined) user.website = website || null;
    if (profilePicture !== undefined) user.profilePicture = profilePicture || null;
    
    // Update preferences if provided
    if (preferences) {
      if (preferences.theme !== undefined) user.preferences.theme = preferences.theme;
      if (preferences.units !== undefined) user.preferences.units = preferences.units;
      if (preferences.language !== undefined) user.preferences.language = preferences.language;
      if (preferences.timezone !== undefined) user.preferences.timezone = preferences.timezone;
    }
    
    // Update notifications if provided
    if (notifications) {
      if (notifications.email !== undefined) user.notifications.email = notifications.email;
      if (notifications.push !== undefined) user.notifications.push = notifications.push;
      if (notifications.mealReminders !== undefined) user.notifications.mealReminders = notifications.mealReminders;
      if (notifications.shoppingReminders !== undefined) user.notifications.shoppingReminders = notifications.shoppingReminders;
    }

    // Update email if provided (with duplicate check)
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: req.userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = email;
    }

    // Handle password update if new password is provided
    if (newPassword) {
      // Require current password for security
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password' });
      }

      // Verify current password before allowing change
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Validate new password length
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      // Enforce strong password requirements
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!strongPasswordRegex.test(newPassword)) {
        return res.status(400).json({ error: 'Password is too weak' });
      }

      // Hash and set new password
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // Save updated user
    await user.save();
    console.log('User saved with fields:', { 
      name: user.name, 
      bio: user.bio, 
      location: user.location, 
      website: user.website 
    });

    // Return updated user data (without password)
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        location: user.location,
        website: user.website,
        profilePicture: user.profilePicture,
        preferences: user.preferences,
        notifications: user.notifications,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Export the router
module.exports = router;