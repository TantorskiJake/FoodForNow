// controllers/dataController.js

// Import the data model
const { getRecipesFromDatabase } = require('../models/datamodel');

// Function to retrieve recipes using the data model
const getRecipes = async () => {
  try {
    // Use the data model to get recipes from the database
    const documents = await getRecipesFromDatabase();

    // Perform any additional controller logic if needed

    // Return the retrieved recipes
    return documents;
  } catch (error) {
    // Log and handle any errors that occur during the process
    console.error('Error in data controller while fetching recipes:', error);
    throw error;
  }
};

// Export the 'getRecipes' function for use in other modules
module.exports = {
  getRecipes,
};
