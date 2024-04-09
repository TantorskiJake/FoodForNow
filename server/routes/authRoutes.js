// server/routes/authRoutes.js

const express = require('express');
const passport = require('passport');
const router = express.Router();
const { createUser } = require('../controllers/userController');
const isAuthenticated = require('../middleware/authMiddleware');

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
    console.log(req.user)
    res.json({
        message: 'Login successful',
        user: req.user,
        redirectURL: 'http://localhost:8080/api/protecteddata'
    });
});

module.exports = router;
