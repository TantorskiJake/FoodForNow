const express = require('express');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const port = 3000;

const uri = 'your_connection_string'; // Replace with your actual connection string

MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
  if (err) {
    console.error('Error connecting to MongoDB Atlas:', err);
    return;
  }

  const db = client.db('your_database'); // Replace with your actual database name
  const collection = db.collection('your_collection'); // Replace with your actual collection name

  // Define route to fetch data
  app.get('/data', (req, res) => {
    collection.find({}).toArray((err, data) => {
      if (err) throw err;
      res.json(data);
    });
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
