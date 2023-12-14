const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

const uri = 'mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/?retryWrites=true&w=majority'; // Replace with your actual connection string

MongoClient.connect(uri, { useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.error('Error connecting to MongoDB Atlas:', err);
    return;
  }

  const db = client.db('FoodForNow'); // Replace with your actual database name
  const collection = db.collection('Recipes'); // Replace with your actual collection name

  // Define route to fetch data
  app.get('/data', (req, res) => {
    collection.find({}).toArray((err, data) => {
      if (err) throw err;
      res.json(data);
    });
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
