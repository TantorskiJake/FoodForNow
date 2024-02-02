// app.js

const express = require('express');
const configureExpress = require('./config/express');

const app = express();

// Serve static files from the client/public directory
app.use(express.static('client/public'));

// Use the configureExpress function to set up the server
configureExpress(app);

// Optional: Define additional routes or middleware as needed

// Start the server
// const PORT = process.env.PORT || 3000; // Commented out, as port is now handled in configureExpress
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });
