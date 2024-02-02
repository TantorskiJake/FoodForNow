// models/datamodel.js

// Import necessary modules from the 'mongodb' package
const { MongoClient, ServerApiVersion } = require('mongodb');
const { mongoURI } = require('../config/config'); // Import the configuration

// MongoDB connection parameters
const DB_NAME = 'FoodForNow';

// Function to establish a connection to MongoDB and return the database instance
const connectToMongoDB = async () => {
  const client = new MongoClient(mongoURI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    // Attempt to connect to the MongoDB instance
    await client.connect();
  } catch (error) {
    // Log and rethrow any connection errors
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }

  // Return the connected database instance
  return client.db(DB_NAME);
};

// Function to retrieve recipes from the MongoDB database
const getRecipesFromDatabase = async () => {
  try {
    // Establish a connection to the MongoDB database
    const db = await connectToMongoDB();

    // Access the 'Recipes' collection within the connected database
    const collection = db.collection('Recipes');

    // Retrieve all documents from the 'Recipes' collection and convert them to an array
    const documents = await collection.find({}).toArray();

    // Return the array of retrieved documents
    return documents;
  } catch (error) {
    // Log and rethrow any errors that occur during the process
    console.error('Error fetching recipes from MongoDB:', error);
    throw error;
  }
};

// Export the 'connectToMongoDB' and 'getRecipesFromDatabase' functions for use in other modules
module.exports = {
  connectToMongoDB,
  getRecipesFromDatabase,
};
