const express = require('express');
const router = express.Router();
const { getAllRecipes } = require('../controllers/recipeController');
const isAuthenticated = require('../middleware/authMiddleware');

// Public route - does not require authentication
router.get('/publicdata', async (req, res) => {
  try {
    const recipes = await getAllRecipes();
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Protected route - requires authentication
router.get('/protecteddata', isAuthenticated, async (req, res) => {
  try {
    // Access the user through req.user if needed
    const userId = req.user._id;
    
    // Example of protected data fetching
    // const protectedData = await getProtectedData(userId);
    
    res.json({ message: 'This is protected data for authenticated users.' });
  } catch (error) {
    console.error('Error fetching protected data:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
