const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 8080;

// MongoDB connection URL and database name
const url = 'mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/?retryWrites=true&w=majority';
const dbName = 'FoodForNowRecipes';

// Update your MongoClient connection code
MongoClient.connect(url, (err, client) => {
    if (err) {
        console.error('Error connecting to MongoDB:', err);
        return;
    }

    console.log(`Connected to MongoDB database: ${dbName}`);

    // Get the database instance
    const db = client.db(dbName);

    // Additional setup or routes can go here

    // Start the Express server
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});
