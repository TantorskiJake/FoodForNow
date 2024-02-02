// app.js

const express = require('express');
const configureExpress = require('./config/express');

const app = express();

// Serve static files from the client/public directory
app.use(express.static('client/public'));

// Use the configureExpress function to set up the server
configureExpress(app);
