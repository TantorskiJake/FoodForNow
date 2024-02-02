// models/datamodel.js

const { MongoClient, ServerApiVersion } = require('mongodb');
const { mongoURI } = require('../config/config');

const DB_NAME = 'FoodForNow';

const connectToMongoDB = async () => {
  try {
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

const getRecipesFromDatabase = async () => {
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
  connectToMongoDB,
  getRecipesFromDatabase,
};
