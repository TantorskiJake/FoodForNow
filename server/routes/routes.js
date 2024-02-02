// routes.js

// Importing the required modules
const express = require('express');
const { getRecipes } = require('../controllers/dataController');

// Creating an instance of the Express Router
const router = express.Router();

// A higher-order function to handle asynchronous operations and errors
const asyncHandler = (fn) => (req, res, next) => {
  // Wrapping the function in a Promise and catching any errors
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Define a route to handle HTTP GET requests at the root endpoint ('/')
router.get('/', (req, res) => {
  // Sending a welcome message for the root endpoint
  res.send('Welcome to the FoodForNow API!');
});

// Define a route to handle HTTP GET requests at the '/api/data' endpoint
router.get('/api/data', asyncHandler(async (req, res) => {
  try {
    // Retrieving recipes using the getRecipes function from the dataController
    const documents = await getRecipes();

    // Sending the retrieved recipes as a JSON response
    res.json(documents);
  } catch (error) {
    // Handling errors by logging them and sending a 500 Internal Server Error response
    console.error('Error fetching recipes:', error);
    res.status(500).send('Internal Server Error');
  }
}));

// Exporting the router as the default export for use in other parts of the application
module.exports = router;
