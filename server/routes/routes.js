// routes.js

const express = require('express');
const passport = require('passport');
const { getRecipes } = require('../controllers/dataController');

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Private route with authentication
router.get('/api/data', passport.authenticate('local'), asyncHandler(async (req, res) => {
  try {
    const documents = await getRecipes();
    res.json(documents);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).send('Internal Server Error');
  }
}));

// Public route without authentication
router.get('/api/publicdata', asyncHandler(async (req, res) => {
  try {
    const documents = await getRecipes();
    res.json(documents);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).send('Internal Server Error');
  }
}));

module.exports = router;
