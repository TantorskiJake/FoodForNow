const mongoose = require('mongoose');
const User = require('../models/user');
const Ingredient = require('../models/ingredient');
const Recipe = require('../models/recipe');
const Pantry = require('../models/pantry');
const ShoppingListItem = require('../models/shopping-list-item');
const MealPlan = require('../models/mealPlan');

async function cleanupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/foodfornow');
    console.log('Connected to MongoDB');

    // Find the system user
    const systemUser = await User.findOne({ email: 'system@foodfornow.com' });
    if (!systemUser) {
      console.log('System user not found, creating...');
      const newSystemUser = await User.create({
        email: 'system@foodfornow.com',
        password: 'SystemUser123!',
        name: 'System'
      });
      console.log('System user created');
    }

    // Delete all non-system users
    const result = await User.deleteMany({ email: { $ne: 'system@foodfornow.com' } });
    console.log(`Deleted ${result.deletedCount} users`);

    // Delete all ingredients except system ones
    const ingredientResult = await Ingredient.deleteMany({ user: { $ne: systemUser._id } });
    console.log(`Deleted ${ingredientResult.deletedCount} ingredients`);

    // Delete all recipes
    const recipeResult = await Recipe.deleteMany({});
    console.log(`Deleted ${recipeResult.deletedCount} recipes`);

    // Delete all pantry items
    const pantryResult = await Pantry.deleteMany({});
    console.log(`Deleted ${pantryResult.deletedCount} pantry items`);

    // Delete all shopping list items
    const shoppingListResult = await ShoppingListItem.deleteMany({});
    console.log(`Deleted ${shoppingListResult.deletedCount} shopping list items`);

    // Delete all meal plans
    const mealPlanResult = await MealPlan.deleteMany({});
    console.log(`Deleted ${mealPlanResult.deletedCount} meal plans`);

    console.log('Database cleanup completed successfully');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupDatabase(); 