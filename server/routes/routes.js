// Import necessary modules
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');

// Create an instance of the Express Router
const routes = express.Router();

// Define a route for the root path ('/') using the 'get' method
routes.get('/', async (req, res) => {
  // MongoDB connection URL and database name
  const uri = "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/?retryWrites=true&w=majority";
  const dbName = 'FoodForNow';

  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Example query: Find all documents in a collection
    const collection = client.db(dbName).collection('Recipes');
    const documents = await collection.find({}).toArray();
    console.log("Found documents:", documents);
    
    // Send the queried documents as JSON response
    res.json(documents);

  } finally {
    // Ensure that the client will close when you finish/error
    await client.close();
  }
});

// Export the 'routes' object to make it accessible to other parts of the application
module.exports = { routes };


