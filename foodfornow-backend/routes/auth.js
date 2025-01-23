const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

// Token expiration durations
const ACCESS_TOKEN_EXPIRATION = "1h";
const REFRESH_TOKEN_EXPIRATION = "7d";

// Temporary refresh token storage (use a database in production)
const refreshTokens = [];

// Ensure JWT secrets are defined
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT secrets are not defined in the environment variables.");
}

// Helper function to generate tokens
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
// Register a new user
router.post("/register", validateRequest(["name", "email", "password"]), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("Register Attempt:", { name, email, password }); // Log plaintext password

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error("Email already exists:", email); // Log duplicate email
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed Password During Registration:", hashedPassword); // Log hashed password

    // Create and save the user
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    console.log("Registered User:", user); // Log user details
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Error during user registration:", err); // Log registration errors
    res.status(500).json({ error: "Registration failed. Please try again later." });
  }
});

// Login a user
router.post("/login", validateRequest(["email", "password"]), async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login Attempt:", { email });

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.error("User not found for email:", email);
      return res.status(400).json({ error: "Invalid email or password" });
    }

    console.log("User Found:", user);

    // Validate the password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log("Password Validation Result:", validPassword);

    if (!validPassword) {
      console.error("Invalid password for user:", email);
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    refreshTokens.push(refreshToken);

    console.log("Login Successful for User:", email);
    return res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error("Error during user login:", err);
    res.status(500).json({ error: "Login failed. Please try again later." });
  }
});

// Refresh access token
router.post("/token", validateRequest(["refreshToken"]), (req, res) => {
  const { refreshToken } = req.body;

  console.log("Refresh Token Attempt:", refreshToken);

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({ error: "Invalid or missing refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    console.log("Decoded Refresh Token:", decoded);

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.id);

    // Replace the old refresh token
    refreshTokens.splice(refreshTokens.indexOf(refreshToken), 1, newRefreshToken);

    return res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error("Error during token refresh:", err);
    res.status(403).json({ error: "Invalid refresh token" });
  }
});

// Logout a user (invalidate refresh token)
router.post("/logout", validateRequest(["refreshToken"]), (req, res) => {
  const { refreshToken } = req.body;

  console.log("Logout Attempt with Refresh Token:", refreshToken);

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  const index = refreshTokens.indexOf(refreshToken);
  if (index > -1) {
    refreshTokens.splice(index, 1); // Remove the refresh token
    console.log("Refresh token removed successfully");
  }

  res.json({ message: "User logged out successfully" });
});

module.exports = router;