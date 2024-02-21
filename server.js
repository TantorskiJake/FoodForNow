const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes/recipes');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection URI
const uri = "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/?retryWrites=true&w=majority";

// Mongoose connection setup
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  // Use the routes as middleware
  app.use('/api', routes);
  
  const PORT = process.env.PORT || 5000;
  // Start the server
  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  
  // Optional: Handle server errors
  server.on('error', (error) => {
    console.error('Server error:', error);
    // You might want to handle server errors here
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit the process if unable to connect to MongoDB
});
