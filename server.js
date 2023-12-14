const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const port = 3000;
const Recipe = require('./models/recipes.js'); // Adjust the path accordingly

// Connect to MongoDB (replace 'your_connection_string' with your actual connection string)
mongoose.connect('mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/test?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Check MongoDB connection
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
  startServer();
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

function startServer() {
  // Serve static files from the 'public' directory
  app.use(express.static(path.join(__dirname, 'public')));

  // Use JSON middleware
  app.use(express.json());

  // Serve HTML file
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  // Serve script.js with correct Content-Type
  app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'), { headers: { 'Content-Type': 'application/javascript' } });
  });

  // Define a route to retrieve and send data
  app.get('/api/recipes', async (req, res) => {
    try {
      console.log('Attempting to fetch recipes from MongoDB');
      const recipes = await Recipe.find();
      console.log('Recipes from MongoDB:', recipes);
      res.json(recipes);
    } catch (error) {
      console.error('Error fetching recipes from MongoDB:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message, stack: error.stack });
    }
  });

  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}
