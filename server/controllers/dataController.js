// controllers/dataController.js

// Importing required modules for MongoDB connection
const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB connection details
const MONGO_URI = "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/?retryWrites=true&w=majority";
const DB_NAME = 'FoodForNow';

/**
 * Establish a connection to MongoDB and return the connected database instance.
 * @returns {Promise} A Promise that resolves to the MongoDB database instance.
 */
const connectToMongoDB = async () => {
  // Creating a new MongoClient instance with specified server API version and options
  const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    // Attempting to establish a connection to the MongoDB server
    await client.connect();
  } catch (error) {
    // Handling and logging any errors that occur during the connection attempt
    console.error('Error connecting to MongoDB:', error);
    throw error; // Re-throwing the error to be caught by the calling function
  }

  // Returning the connected MongoDB database instance
  return client.db(DB_NAME);
};

/**
 * Retrieve recipes from the MongoDB database.
 * @returns {Promise} A Promise that resolves to an array of recipe documents.
 */
const getRecipes = async () => {
  try {
    // Establishing a connection to the MongoDB database
    const db = await connectToMongoDB();

    // Accessing the 'Recipes' collection within the database
    const collection = db.collection('Recipes');

    // Fetching all documents from the 'Recipes' collection and converting them to an array
    const documents = await collection.find({}).toArray();

    // Returning the array of recipe documents
    return documents;
  } catch (error) {
    // Handling and logging any errors that occur during the fetch operation
    console.error('Error fetching recipes from MongoDB:', error);
    throw error; // Re-throwing the error to be caught by the calling function
  }
};

// Exporting the getRecipes function to make it accessible to other modules
module.exports = {
  getRecipes,
};
