// Import the 'express' module to create a web server.
const express = require('express');

// Create an instance of the Express Router.
const routes = express.Router();

// Define a route for the root path ('/') using the 'get' method.
routes.get('/', (req, res) => {
  // When a request is made to the root path, send the response 'Hello world or something'.
  res.send('Hello world or something');
});

// Export the 'routes' object to make it accessible to other parts of the application.
module.exports = { routes };
