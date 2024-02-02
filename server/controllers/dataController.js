// controllers/dataController.js

const { getRecipesFromDatabase } = require('../models/dataModel');

const getRecipes = async () => {
  try {
    const documents = await getRecipesFromDatabase();
    return documents;
  } catch (error) {
    console.error('Error in data controller while fetching recipes:', error);
    throw error;
  }
};

module.exports = {
  getRecipes,
};
