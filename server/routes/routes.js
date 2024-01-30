// routes.js

const express = require('express');
const { getRecipes } = require('../controllers/dataController');

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Define a route to handle HTTP GET requests at the root endpoint ('/')
router.get('/', (req, res) => {
  res.send('Welcome to the FoodForNow API!');
});

// Define a route to handle HTTP GET requests at the '/api/data' endpoint
router.get('/api/data', asyncHandler(async (req, res) => {
  try {
    const documents = await getRecipes();
    res.json(documents);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).send('Internal Server Error');
  }
}));

module.exports = { router };
