const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = 8080;

// MongoDB connection URL and database name
const uri = "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/?retryWrites=true&w=majority";
const dbName = 'FoodForNowRecipes';


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
    try {
      // Connect the client to the server (optional starting in v4.7)
      await client.connect();
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
  
      // Example query: Find all documents in a collection
      const collection = client.db(dbName).collection('Recipes');
      const documents = await collection.find({}).toArray();
      console.log("Found documents:", documents);
  
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }


 // Start the Express server
 app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
