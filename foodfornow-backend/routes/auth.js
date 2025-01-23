const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

// Token expiration durations
const ACCESS_TOKEN_EXPIRATION = "1h";
const REFRESH_TOKEN_EXPIRATION = "7d";

// Refresh token storage (use a database or Redis in production)
const refreshTokens = [];

// Helper to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
  });

  return { accessToken, refreshToken };
};

// Register a new user
router.post("/register", validateRequest(["name", "email", "password"]), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already exists" });

    const user = new User({ name, email, password });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed. Please try again later." });
  }
});

// Login a user
router.post("/login", validateRequest(["email", "password"]), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid email or password" });

    const { accessToken, refreshToken } = generateTokens(user._id);
    refreshTokens.push(refreshToken); // Store refresh token (in memory for now)

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed. Please try again later." });
  }
});

// Refresh access token
router.post("/token", validateRequest(["refreshToken"]), (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || !refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ error: "Invalid or missing refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);

    // Replace old refresh token with the new one
    refreshTokens.splice(refreshTokens.indexOf(refreshToken), 1, newRefreshToken);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ error: "Invalid refresh token" });
  }
});

// Logout a user (invalidate refresh token)
router.post("/logout", validateRequest(["refreshToken"]), (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(400).json({ error: "Missing refresh token" });

  const index = refreshTokens.indexOf(refreshToken);
  if (index > -1) {
    refreshTokens.splice(index, 1); // Remove refresh token
  }

  res.json({ message: "User logged out successfully" });
});

module.exports = router;
