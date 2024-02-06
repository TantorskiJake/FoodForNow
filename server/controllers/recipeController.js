const Recipe = require('../models/recipe');

const getAllRecipes = async () => {
  try {
    const recipes = await Recipe.find({}, { title: 1, _id: 0 });
    console.log('Fetched recipes:', recipes);  // Add this line to log fetched recipes
    return recipes;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
};


const getRecipeById = async (recipeId) => {
  try {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw new Error('Recipe not found');
    }
    return recipe;
  } catch (error) {
    console.error(`Error fetching recipe with ID ${recipeId}:`, error);
    throw error;
  }
};

module.exports = {
  getAllRecipes,
  getRecipeById,
};
