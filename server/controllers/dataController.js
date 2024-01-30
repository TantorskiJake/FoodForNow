// controllers/dataController.js

// Import necessary modules from the 'mongodb' package
const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB connection parameters
const MONGO_URI = "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/?retryWrites=true&w=majority";
const DB_NAME = 'FoodForNow';

// Function to establish a connection to MongoDB and return the database instance
const connectToMongoDB = async () => {
  // Create a new MongoClient instance with specified options
  const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1, // Specify the version of the MongoDB Server API
      strict: true, // Enable strict mode for the Server API
      deprecationErrors: true, // Log deprecation errors for the Server API
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
const getRecipes = async () => {
  try {
    // Establish a connection to the MongoDB database
    const db = await connectToMongoDB();

    // Access the 'Recipes' collection within the connected database
    const collection = db.collection('Recipes');

    // Retrieve all documents from the 'Recipes' collection and convert them to an array
    const documents = await collection.find({}).toArray();

    // Log the retrieved documents for debugging purposes
    console.log('Retrieved documents:', documents);

    // Return the array of retrieved documents
    return documents;
  } catch (error) {
    // Log and rethrow any errors that occur during the process
    console.error('Error fetching recipes from MongoDB:', error);
    throw error;
  }
};

// Export the 'getRecipes' function for use in other modules
module.exports = {
  getRecipes,
};
