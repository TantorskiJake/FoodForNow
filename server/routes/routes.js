// routes.js

// Import the express library and the getRecipes function from the dataController module
const express = require('express');
const { getRecipes } = require('../controllers/dataController');

// Create an instance of an Express router
const router = express.Router();

// Define a route to handle HTTP GET requests at the root endpoint ('/')
router.get('/', async (req, res) => {
  try {
    // Attempt to fetch recipes by calling the getRecipes function from the dataController
    const documents = await getRecipes();

    // Respond with a JSON representation of the fetched recipes
    res.json(documents);
  } catch (error) {
    // If an error occurs during the fetch operation, log the error and send a 500 Internal Server Error response
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Export the router instance to make it accessible to other modules
module.exports = { routes: router };
