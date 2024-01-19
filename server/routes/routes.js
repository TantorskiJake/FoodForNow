// Import necessary modules
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');

// Create an instance of Express Router
const routes = express.Router();

// Define a route for handling GET requests at the root path '/'
routes.get('/', async (req, res) => {
  // MongoDB connection URI and database name
  const uri = "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/?retryWrites=true&w=majority";
  const dbName = 'FoodForNow';

  // Create a new MongoClient instance with specified server API version
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    // Connect to the MongoDB deployment
    await client.connect();
    // Ping the MongoDB server to confirm successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Access the 'Recipes' collection in the specified database
    const collection = client.db(dbName).collection('Recipes');
    // Retrieve all documents from the collection
    const documents = await collection.find({}, { projection: { _id: 1, title: 1, ingredients: 1 } }).toArray();
    console.log("Found documents:", documents);

    // Respond with the retrieved documents in JSON format
    res.json(documents);

  } finally {
    // Ensure the MongoClient is closed, whether an error occurred or not
    await client.close();
  }
});

// Export the defined routes for use in other modules
module.exports = { routes };
