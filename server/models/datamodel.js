// models/datamodel.js

const { MongoClient, ServerApiVersion } = require('mongodb');
const { mongoURI } = require('../config/config');
const passport = require('passport'); // Add this line to import Passport

const DB_NAME = 'FoodForNow';

const connectToMongoDB = async (req) => {
  try {
    // Check if the user is authenticated before proceeding
    if (!req.isAuthenticated()) {
      throw new Error('Unauthorized');
    }

    const client = new MongoClient(mongoURI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();
    console.log(`Connected to MongoDB database: ${DB_NAME}`);

    return client.db(DB_NAME);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

const getRecipesFromDatabase = async (req) => {
  try {
    // Establish a connection to the MongoDB database
    const db = await connectToMongoDB(req);

    const collection = db.collection('Recipes');
    const documents = await collection.find({}).toArray();

    return documents;
  } catch (error) {
    console.error('Error fetching recipes from MongoDB:', error);
    throw error;
  }
};

module.exports = {
  connectToMongoDB,
  getRecipesFromDatabase,
};
