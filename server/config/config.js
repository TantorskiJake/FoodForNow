// config/config.js

// Exporting configuration object
module.exports = {
    // MongoDB connection URI with a default value for local development
    mongoURI: process.env.MONGO_URI || "mongodb://localhost:27017/FoodForNow",
  };
  