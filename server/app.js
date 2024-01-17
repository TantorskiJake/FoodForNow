// server/app.js

const express = require('express');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const port = 3000;

// MongoDB connection URL and database name
const url = 'mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/FoodForNow';
const dbName = 'FoodForNow';

// Update your MongoClient connection code
MongoClient.connect(url, (err, client) => {
    if (err) {
      console.error(err);
      return;
    }
  
    console.log('Connected to MongoDB');
  
    // Get the database instance
    const db = client.db(dbName);
  
    // Additional setup or routes can go here
  
    // Start the Express server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  });
  