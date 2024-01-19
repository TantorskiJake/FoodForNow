// Import necessary modules
const { MongoClient, ServerApiVersion } = require('mongodb');  
// Importing MongoClient and ServerApiVersion from the 'mongodb' library for MongoDB database interaction
const express = require('express');  
// Importing the 'express' library for building web applications and defining routes

// Create an instance of the Express Router
const routes = express.Router();  
// Creating an instance of the Express Router to define application routes

// Define a route for the root path ('/') using the 'get' method
routes.get('/', async (req, res) => {
  // MongoDB connection URL and database name
  const uri = "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/?retryWrites=true&w=majority";  
  // MongoDB connection URL containing credentials and database name for establishing a connection
  const dbName = 'FoodForNow';  
  // Database name for MongoDB, specifying the target database for the application

  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,  
      // Setting the MongoDB Server API version to v1 for compatibility and stability
      strict: true,  
      // Enabling strict mode for API compatibility to ensure adherence to specified rules
      deprecationErrors: true,  
      // Handling deprecation errors to receive notifications about outdated features
    }
  });

  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();  
    // Establishing a connection to the MongoDB server as part of the application initialization
    // Note: This step is optional starting in MongoDB version 4.7

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });  
    // Pinging the MongoDB deployment to confirm a successful connection
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Example query: Find all documents in a collection
    const collection = client.db(dbName).collection('Recipes');  
    // Accessing the 'Recipes' collection in the 'FoodForNow' database for data retrieval
    const documents = await collection.find({}).toArray();  
    // Querying all documents in the collection and converting them to an array
    console.log("Found documents:", documents);

    // Send the queried documents as JSON response
    res.json(documents);  
    // Sending the queried documents as a JSON response to the client for further processing

  } finally {
    // Ensure that the client will close when you finish/error
    await client.close();  
    // Closing the MongoDB client connection to release resources and maintain system efficiency
  }
});

// Export the 'routes' object to make it accessible to other parts of the application
module.exports = { routes };  
// Exporting the 'routes' object to make it accessible to other parts of the application for modular design
