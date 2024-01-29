// controllers/dataController.js

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/?retryWrites=true&w=majority";
const dbName = 'FoodForNow';

const connectToMongoDB = async () => {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  return client.db(dbName);
};

const getRecipes = async () => {
  const db = await connectToMongoDB();
  const collection = db.collection('Recipes');
  const documents = await collection.find({}, { projection: { _id: 1, title: 1, ingredients: 1 } }).toArray();
  return documents;
};

module.exports = {
  getRecipes,
};
