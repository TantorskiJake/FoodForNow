const mongoose = require('mongoose');
const User = require('../models/user');
const Ingredient = require('../models/ingredient');
const Recipe = require('../models/recipe');
const Pantry = require('../models/pantry');
const ShoppingListItem = require('../models/shopping-list-item');
const MealPlan = require('../models/mealPlan');

/**
 * Database Cleanup Script
 * 
 * This script performs a complete cleanup of the database for development/testing purposes.
 * It removes all user data except for a system user, and clears all related collections.
 * 
 * WARNING: This will permanently delete all user data!
 * Only use this script in development environments.
 * 
 * Usage: node src/scripts/cleanup-db.js
 */

/**
 * Main cleanup function
 * 
 * Connects to MongoDB and performs a complete database cleanup:
 * 1. Creates or finds a system user
 * 2. Deletes all non-system users
 * 3. Clears all related collections (ingredients, recipes, pantry, etc.)
 */
async function cleanupDatabase() {
  try {
    // Connect to local MongoDB instance
    await mongoose.connect('mongodb://localhost:27017/foodfornow');
    console.log('Connected to MongoDB');

    // Find or create the system user (password from env; required in production)
    const systemPassword = process.env.SYSTEM_USER_PASSWORD;
    if (process.env.NODE_ENV === 'production' && !systemPassword) {
      throw new Error('SYSTEM_USER_PASSWORD is required in production');
    }
    const passwordToUse = systemPassword || 'SystemUser123!';
    let systemUser = await User.findOne({ email: 'system@foodfornow.com' });
    if (!systemUser) {
      console.log('System user not found, creating...');
      const bcrypt = require('bcrypt');
      const hashed = await bcrypt.hash(passwordToUse, 12);
      await User.create({
        email: 'system@foodfornow.com',
        password: hashed,
        name: 'System'
      });
      systemUser = await User.findOne({ email: 'system@foodfornow.com' });
      console.log('System user created');
    }

    // Delete all users except the system user
    // This removes all regular user accounts and their associated data
    const result = await User.deleteMany({ email: { $ne: 'system@foodfornow.com' } });
    console.log(`Deleted ${result.deletedCount} users`);

    // Delete all ingredients except those owned by the system user
    // System ingredients are preserved for seeding and reference
    const ingredientResult = await Ingredient.deleteMany({ user: { $ne: systemUser._id } });
    console.log(`Deleted ${ingredientResult.deletedCount} ingredients`);

    // Delete all recipes (all recipes are user-created)
    const recipeResult = await Recipe.deleteMany({});
    console.log(`Deleted ${recipeResult.deletedCount} recipes`);

    // Delete all pantry items (all pantry data is user-specific)
    const pantryResult = await Pantry.deleteMany({});
    console.log(`Deleted ${pantryResult.deletedCount} pantry items`);

    // Delete all shopping list items (all shopping lists are user-specific)
    const shoppingListResult = await ShoppingListItem.deleteMany({});
    console.log(`Deleted ${shoppingListResult.deletedCount} shopping list items`);

    // Delete all meal plans (all meal plans are user-specific)
    const mealPlanResult = await MealPlan.deleteMany({});
    console.log(`Deleted ${mealPlanResult.deletedCount} meal plans`);

    console.log('Database cleanup completed successfully');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    // Always disconnect from MongoDB when done
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup function
cleanupDatabase(); 