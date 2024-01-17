// Import the Express framework
const express = require('express');

// Import the routes module from the specified path
const { routes } = require('./routes/routes');

// Create an instance of the Express application
const app = express();

// Set the port number for the server
const port = 8080;

// Use the imported routes in the Express application
app.use(routes);

// Start the Express server and listen on the specified port
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
