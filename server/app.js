// app.js

// Import the necessary modules
const express = require('express');
const cors = require('cors');
const router = require('./routes/routes'); // Importing the router as the default export

// Create an instance of the Express application
const app = express();

// Define the port on which the server will listen
const port = 8080;

// Use cors middleware to enable Cross-Origin Resource Sharing
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Use the custom router defined in the routes directory
app.use(router);

// Error handling middleware to catch any errors that occur during request processing
app.use((err, req, res, next) => {
  console.error('Error:', err); // Log the error to the console
  res.status(500).send('Internal Server Error'); // Send a 500 Internal Server Error response to the client
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`); // Log a message indicating that the server is running
});
