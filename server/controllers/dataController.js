// controllers/dataController.js

// Import necessary MongoDB library components
const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB connection URI and database name
const uri = "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/?retryWrites=true&w=majority";
const dbName = 'FoodForNow';

/**
 * Establish a connection to MongoDB and return the connected database instance.
 * @returns {Promise} A Promise that resolves to the MongoDB database instance.
 */
const connectToMongoDB = async () => {
  // Create a new MongoClient instance with the specified URI and server options
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,  // Specify the MongoDB Server API version
      strict: true,                   // Enable strict mode for API usage
      deprecationErrors: true,        // Report deprecation errors
    },
  });

  // Connect to the MongoDB server
  await client.connect();

  // Return the connected database instance
  return client.db(dbName);
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

// Export the getRecipes function to make it accessible to other modules
module.exports = {
  getRecipes,
};
