const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const RefreshToken = require("../models/refreshToken");
const validateRequest = require("../middleware/validateRequest");
const auth = require('../middleware/auth');

const router = express.Router();

// Token expiration durations
const ACCESS_TOKEN_EXPIRATION = "1h";
const REFRESH_TOKEN_EXPIRATION = "7d";
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

// Calculate expiration times
const getExpirationTime = (duration) => {
  const ms = duration === "1h" ? 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 1 hour or 7 days
  return new Date(Date.now() + ms);
};

// Helper function to generate tokens
const generateTokens = async (userId) => {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  });

  const refreshToken = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
  });

  // Store refresh token in database
  const refreshTokenDoc = new RefreshToken({
    token: refreshToken,
    user: userId,
    expiresAt: getExpirationTime(REFRESH_TOKEN_EXPIRATION),
  });

  await refreshTokenDoc.save();

  return { accessToken, refreshToken };
};

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Received registration request:', { ...req.body, password: '***' });
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      console.log('Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      console.log('Password too short');
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email already registered:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    console.log('User created successfully:', { id: user._id, email: user.email });

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Received login request:', { email: req.body.email, password: '***' });
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Missing required fields:', { email: !!email, password: !!password });
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Login successful for user:', { id: user._id, email: user.email });
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get user
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
        email: user.email
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Refresh access token
router.post("/token", validateRequest(["refreshToken"]), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Check if refresh token exists in database and is not revoked
    const tokenDoc = await RefreshToken.findOne({ 
      token: refreshToken, 
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return res.status(403).json({ error: "Invalid or expired refresh token" });
    }

    // Verify JWT signature
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(decoded.userId);

    // Revoke the old refresh token
    tokenDoc.isRevoked = true;
    await tokenDoc.save();

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Logout a user (invalidate refresh token)
router.post("/logout", validateRequest(["refreshToken"]), async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Find and revoke the refresh token
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken });
    if (tokenDoc) {
      tokenDoc.isRevoked = true;
      await tokenDoc.save();
    }

    res.json({ message: "User logged out successfully" });
  } catch (err) {
    console.error("Error during logout:", err);
    res.status(500).json({ error: "Logout failed. Please try again later." });
  }
});

module.exports = router;