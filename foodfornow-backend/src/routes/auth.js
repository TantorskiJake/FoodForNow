const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user");
const RefreshToken = require("../models/refreshToken");
const PasswordResetToken = require("../models/passwordResetToken");
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

// Cookie configuration for secure token storage (explicit so analyzers see httpOnly/secure)
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
};
/**
 * POST /auth/register - Register a new user
 * 
 * Creates a new user account with hashed password and returns authentication tokens.
 * Validates input, checks for existing users, and enforces password strength.
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // Validate required fields and types
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (typeof password !== 'string' || typeof name !== 'string' || typeof email !== 'string') {
      return res.status(400).json({ error: 'Invalid field types' });
    }

    // Enforce minimum password length
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Enforce strong password requirements
    // Must contain: lowercase, uppercase, digit, and special character
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({ error: 'Password is too weak' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
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
    // Check for registration achievements
    try {
      const AchievementService = require('../services/achievementService');
      const achievements = await AchievementService.checkRegistrationAchievements(user._id);
      
      // Generate authentication tokens
      const { accessToken, refreshToken } = await generateTokens(user._id);

      // Set secure HTTP-only cookies
      res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: cookieOptions.sameSite, maxAge: 60 * 60 * 1000 });
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: cookieOptions.sameSite, maxAge: 7 * 24 * 60 * 60 * 1000 });
      
      // Return user data and achievements if any were unlocked
      if (achievements && achievements.length > 0) {
        const newlyCompleted = achievements.filter(a => a.newlyCompleted);
        if (newlyCompleted.length > 0) {
          res.status(201).json({
            user: {
              id: user._id,
              name: user.name,
              email: user.email
            },
            achievements: newlyCompleted.map(a => ({
              name: a.config.name,
              description: a.config.description,
              icon: a.config.icon
            }))
          });
          return;
        }
      }
      
      // Return user data (without password)
      res.status(201).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
      
      // Generate authentication tokens
      const { accessToken, refreshToken } = await generateTokens(user._id);

      // Set secure HTTP-only cookies
      res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: cookieOptions.sameSite, maxAge: 60 * 60 * 1000 });
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: cookieOptions.sameSite, maxAge: 7 * 24 * 60 * 60 * 1000 });
      
      // Return user data (without password)
      res.status(201).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    }
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
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate new authentication tokens
    const { accessToken, refreshToken } = await generateTokens(user._id);

    // Set secure HTTP-only cookies
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: cookieOptions.sameSite, maxAge: 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: cookieOptions.sameSite, maxAge: 7 * 24 * 60 * 60 * 1000 });
    
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
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: cookieOptions.sameSite, maxAge: 60 * 60 * 1000 });
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: cookieOptions.sameSite, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * POST /auth/forgot-password - Request password reset
 *
 * Generates a reset token for the given email. Returns the token so the user
 * can be redirected to the reset page (email integration can be added later).
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link will be sent.' });
    }

    // Invalidate any existing reset tokens for this user
    await PasswordResetToken.deleteMany({ user: user._id });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await new PasswordResetToken({
      token,
      user: user._id,
      expiresAt,
    }).save();

    res.json({
      success: true,
      message: 'If that email exists, a reset link will be sent.',
      resetToken: token, // For now, return token so user can reset (add email later)
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request. Please try again.' });
  }
});

/**
 * POST /auth/reset-password - Reset password with token
 *
 * Validates the reset token and updates the user's password.
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const resetDoc = await PasswordResetToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!resetDoc) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Please request a new one.' });
    }

    const user = await User.findById(resetDoc.user);
    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'Password is too weak. Use upper, lower, number, and special character.' });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await PasswordResetToken.deleteOne({ _id: resetDoc._id });

    res.json({ success: true, message: 'Password has been reset. You can now sign in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
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
    
    // Update preferences if provided (validate type)
    if (preferences && typeof preferences === 'object' && !Array.isArray(preferences)) {
      if (typeof preferences.theme === 'string') user.preferences.theme = preferences.theme;
      if (typeof preferences.units === 'string') user.preferences.units = preferences.units;
      if (typeof preferences.language === 'string') user.preferences.language = preferences.language;
      if (typeof preferences.timezone === 'string') user.preferences.timezone = preferences.timezone;
    }
    
    // Update notifications if provided (validate type to avoid prototype pollution)
    if (notifications && typeof notifications === 'object' && !Array.isArray(notifications)) {
      if (typeof notifications.email === 'boolean') user.notifications.email = notifications.email;
      if (typeof notifications.push === 'boolean') user.notifications.push = notifications.push;
      if (typeof notifications.mealReminders === 'boolean') user.notifications.mealReminders = notifications.mealReminders;
      if (typeof notifications.shoppingReminders === 'boolean') user.notifications.shoppingReminders = notifications.shoppingReminders;
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

      // Validate new password type and length
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
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

    await user.save();
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