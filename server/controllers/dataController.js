// controllers/dataController.js

const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB connection details
const MONGO_URI = "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/?retryWrites=true&w=majority";
const DB_NAME = 'FoodForNow';

/**
 * Establish a connection to MongoDB and return the connected database instance.
 * @returns {Promise} A Promise that resolves to the MongoDB database instance.
 */
const connectToMongoDB = async () => {
  // Create a new MongoClient instance with specified options
  const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    // Attempt to connect to the MongoDB server
    await client.connect();
  } catch (error) {
    // Handle connection error and log it
    console.error('Error connecting to MongoDB:', error);
    throw error; // Re-throw the error to propagate it up the call stack
  }

  // Return the connected database instance
  return client.db(DB_NAME);
};

/**
 * Retrieve recipes from the MongoDB database.
 * @returns {Promise} A Promise that resolves to an array of recipe documents.
 */
const getRecipes = async () => {
  // Connect to MongoDB
  const db = await connectToMongoDB();

  // Access the 'Recipes' collection
  const collection = db.collection('Recipes');

  // Fetch documents with specified projection (include only _id, title, and ingredients fields)
  const documents = await collection.find({}, { projection: { _id: 1, title: 1, ingredients: 1 } }).toArray();

  // Return the fetched documents
  return documents;
};

module.exports = {
  getRecipes,
};
