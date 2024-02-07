const express = require('express');
const passport = require('passport');
const { getAllRecipes } = require('../controllers/recipeController');
const isAuth = require('../middleware/authMiddleware');  // Updated identifier
const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Public route - does not require authentication
router.get('/api/publicdata', asyncHandler(async (req, res) => {
  try {
    const recipes = await getAllRecipes();
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).send('Internal Server Error');
  }
}));

// Authenticated route - requires authentication
router.get('/api/protecteddata', 
  passport.authenticate('local'), // Middleware for authentication
  isAuth, // Custom middleware to check if user is authenticated
  asyncHandler(async (req, res) => {
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
  })
);

module.exports = router;
