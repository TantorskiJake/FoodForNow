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
  const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }

  return client.db(DB_NAME);
};

/**
 * Retrieve recipes from the MongoDB database.
 * @returns {Promise} A Promise that resolves to an array of recipe documents.
 */
const getRecipes = async () => {
  try {
    const db = await connectToMongoDB();
    const collection = db.collection('Recipes');
    const documents = await collection.find({}).toArray();
    return documents;
  } catch (error) {
    console.error('Error fetching recipes from MongoDB:', error);
    throw error;
  }
};

module.exports = {
  getRecipes,
};
