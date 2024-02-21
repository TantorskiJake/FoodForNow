// Define Express router
const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');

// GET a random recipe
router.get('/random', async (req, res) => {
  try {
    console.log('Getting Random Recipe');
    // Count the total number of recipes in the database
    const count = await Recipe.countDocuments();
    console.log(count);
    // Generate a random index within the range of total recipes
    const random = Math.floor(Math.random() * count);
    // Retrieve a random recipe from the database
    const randomRecipe = await Recipe.findOne().skip(random);
    res.json(randomRecipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all recipes
router.get('/', async (req, res) => {
  try {
    // Find all recipes in the database
    const allRecipes = await Recipe.find();
    res.json(allRecipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Define a route handler for the root path '/'
router.get('/', async (req, res) => {
  try {
    res.send('Welcome to the Recipe API'); // Send a welcome message or perform any other action
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
