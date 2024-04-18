const express = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { createUser } = require('../controllers/userController');
const User = require('../models/user');

// Register route with validation
router.post('/register', [
  // Validate username
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  // Validate password
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    await createUser({ username, password });

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Registration failed. Please try again later.' });
  }
});

// Login route
router.post('/login', passport.authenticate('local'), (req, res) => {
  // If this function gets called, authentication was successful.
  // `req.user` contains the authenticated user.
  res.json({
    message: 'Login successful',
    user: req.user,
    redirectURL: 'http://localhost:8080/api/protecteddata'
  });
});

module.exports = router;
