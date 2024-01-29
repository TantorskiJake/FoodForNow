// routes.js

const express = require('express');
const { getRecipes } = require('../controllers/dataController');

const router = express.Router();

/**
 * Middleware function to handle asynchronous operations.
 * @param {Function} fn - The asynchronous function to be wrapped.
 * @returns {Function} A middleware function.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Define a route to handle HTTP GET requests at the root endpoint ('/')
router.get('/', asyncHandler(async (req, res) => {
  try {
    // Attempt to fetch recipes using the getRecipes function from dataController
    const documents = await getRecipes();

    // Respond with a JSON representation of the fetched recipes
    res.json(documents);
  } catch (error) {
    // If an error occurs during the fetch operation, log the error and send a 500 Internal Server Error response
    console.error('Error fetching recipes:', error);
    res.status(500).send('Internal Server Error');
  }
}));

// Export the router instance for use in other modules
module.exports = { router };
