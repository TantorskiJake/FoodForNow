const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/user');
const { createUser } = require('../controllers/userController');

// Register route
router.post('/register', async (req, res) => {
  try {
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
  res.json({ message: 'Login successful', user: req.user });
});

module.exports = router;
