const mongoose = require('mongoose');
const MealPlan = require('./src/models/mealPlan');
const Achievement = require('./src/models/achievement');
const AchievementService = require('./src/services/achievementService');
const Recipe = require('./src/models/recipe');

require('dotenv').config();
const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
  console.error('MONGO_URI environment variable is required');
  process.exit(1);
}

mongoose.connect(MONGODB_URI);

async function fixChefInTraining() {
  try {
    const userId = '684898147e276fc616dba647';
    console.log('Checking "Chef in Training" achievement for user:', userId);

    // Find all cooked meals for the user
    const cookedMeals = await MealPlan.find({ user: userId, cooked: true }).populate('recipe');
    const uniqueRecipeIds = new Set();
    const uniqueRecipes = [];
    for (const meal of cookedMeals) {
      if (meal.recipe && !uniqueRecipeIds.has(meal.recipe._id.toString())) {
        uniqueRecipeIds.add(meal.recipe._id.toString());
        uniqueRecipes.push(meal.recipe.name);
      }
    }
    console.log('Unique recipes cooked:', uniqueRecipes.length);
    console.log('Recipes:', uniqueRecipes);

    // Check current achievement
    let chefInTraining = await Achievement.findOne({ userId, achievementId: 'different-recipes-cooked-5' });
    if (chefInTraining) {
      console.log('Current progress:', chefInTraining.progress, '/ 5');
      console.log('Completed:', chefInTraining.completed);
    } else {
      console.log('Achievement does not exist yet. It will be created if progress > 0.');
    }

    // Fix achievement if needed
    if (uniqueRecipes.length !== (chefInTraining?.progress || 0)) {
      console.log('Updating achievement progress...');
      const result = await AchievementService.checkAchievement(userId, 'different-recipes-cooked-5', uniqueRecipes.length);
      console.log('Raw result:', result);
      if (result) {
        console.log('Achievement updated!');
        console.log('New progress:', result.progress, '/ 5');
        console.log('Completed:', result.completed);
      } else {
        console.log('Failed to update achievement.');
      }
    } else {
      console.log('No update needed. Progress is correct.');
    }
  } catch (error) {
    console.error('Error checking/fixing Chef in Training achievement:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixChefInTraining(); 