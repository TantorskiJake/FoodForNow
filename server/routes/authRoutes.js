const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/user');
const Recipe = require('../models/recipe');
const { createUser } = require('../controllers/userController');

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newUser = await createUser({ username, password });

    // Insert a sample recipe after successfully registering a user
    const sampleRecipe = new Recipe({
      title: 'Sample Recipe',
      ingredients: ['Ingredient 1', 'Ingredient 2'],
      instructions: 'Sample Instructions',
    });
    await sampleRecipe.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
