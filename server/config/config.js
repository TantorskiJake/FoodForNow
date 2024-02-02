// config/config.js

// Load environment variables from .env file
require('dotenv').config();

// Exporting configuration object
module.exports = {
  // MongoDB connection URI with a default value for local development
  mongoURI: process.env.MONGO_URI || "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/",
};

    
  