// controllers/dataController.js

const { getRecipesFromDatabase } = require('../models/dataModel');

const getRecipes = async (req, res) => {
  try {
    // Check if the user is authenticated before proceeding
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Use the data model to get recipes from the database
    const documents = await getRecipesFromDatabase();

    // Return the retrieved recipes
    return res.json(documents);
  } catch (error) {
    // Log and handle any errors that occur during the process
    console.error('Error in data controller while fetching recipes:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getRecipes,
};
