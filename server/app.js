// Import the Express framework
const express = require('express');

// Import the router instance from the specified path
const { router } = require('./routes/routes');

// Create an instance of the Express application
const app = express();

// Set the port number for the server
const port = 8080;

// Use middleware to parse JSON in incoming requests
app.use(express.json());

// Use the imported router in the Express application
app.use(router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Internal Server Error');
});

// Start the Express server and listen on the specified port
app.listen(port, () => {
  // Log a message indicating that the server is running and on which port
  console.log(`Server is running on port ${port}`);
});
