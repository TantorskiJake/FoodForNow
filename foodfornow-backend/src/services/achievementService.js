const Achievement = require('../models/achievement');
const achievements = require('../config/achievements');
const Recipe = require('../models/recipe');
const MealPlan = require('../models/mealPlan');
const Pantry = require('../models/pantry');
const ShoppingListItem = require('../models/shopping-list-item');

/**
 * Achievement Service
 * 
 * Handles achievement logic, progress tracking, and unlocking achievements
 * based on user actions throughout the application.
 */

class AchievementService {
  /**
   * Check and update achievement progress
   * @param {string} userId - User ID
   * @param {string} achievementId - Achievement ID
   * @param {number} progress - Current progress value
   * @returns {Promise<Object>} - Achievement update result
   */
  static async checkAchievement(userId, achievementId, progress = 1) {
    try {
      const achievementConfig = achievements[achievementId];
      if (!achievementConfig) {
        console.log(`Achievement ${achievementId} not found in config`);
        return null;
      }

      // Find or create achievement record
      let achievement = await Achievement.findOne({ userId, achievementId });
      
      if (!achievement) {
        // Create new achievement record
        achievement = new Achievement({
          userId,
          achievementId,
          name: achievementConfig.name,
          description: achievementConfig.description,
          category: achievementConfig.category,
          icon: achievementConfig.icon,
          progress: progress,
          requiredProgress: achievementConfig.requiredProgress,
          completed: progress >= achievementConfig.requiredProgress,
          completedAt: progress >= achievementConfig.requiredProgress ? new Date() : null
        });
      } else {
        // Update existing achievement
        const newProgress = Math.min(achievement.progress + progress, achievementConfig.requiredProgress);
        const wasCompleted = achievement.completed;
        
        achievement.progress = newProgress;
        achievement.completed = newProgress >= achievementConfig.requiredProgress;
        
        // Set completion date if just completed
        if (!wasCompleted && achievement.completed) {
          achievement.completedAt = new Date();
        }
      }

      await achievement.save();
      
      // Return achievement data for frontend notification
      return {
        achievement: achievement,
        newlyCompleted: achievement.completed && achievement.completedAt && 
          (new Date() - achievement.completedAt) < 1000, // Within 1 second
        config: achievementConfig
      };
    } catch (error) {
      console.error('Error checking achievement:', error);
      return null;
    }
  }

  /**
   * Check registration achievements
   * @param {string} userId - User ID
   */
  static async checkRegistrationAchievements(userId) {
    const results = [];

    // Check welcome aboard achievement
    const welcomeAboard = await this.checkAchievement(userId, 'welcome-aboard');
    if (welcomeAboard) results.push(welcomeAboard);

    return results;
  }

  /**
   * Check recipe-related achievements
   * @param {string} userId - User ID
   * @param {Object} recipe - Recipe data
   */
  static async checkRecipeAchievements(userId, recipe) {
    const results = [];

    // Check first recipe achievement
    const firstRecipe = await this.checkAchievement(userId, 'first-recipe');
    if (firstRecipe) results.push(firstRecipe);

    // Check recipe count achievements
    const recipeCount = await this.getUserRecipeCount(userId);
    if (recipeCount === 5) {
      const collector = await this.checkAchievement(userId, 'recipes-created-5');
      if (collector) results.push(collector);
    }
    if (recipeCount === 10) {
      const master = await this.checkAchievement(userId, 'recipes-created-10');
      if (master) results.push(master);
    }

    // Check cuisine-based achievements
    if (recipe.category) {
      const cuisineResults = await this.checkCuisineAchievements(userId);
      results.push(...cuisineResults);
    }

    // Check dessert recipes
    if (recipe.category === 'Dessert') {
      const dessertResults = await this.checkDessertAchievements(userId);
      results.push(...dessertResults);
    }

    // Check pizza recipes
    if (recipe.name && recipe.name.toLowerCase().includes('pizza')) {
      const pizzaResults = await this.checkPizzaAchievements(userId);
      results.push(...pizzaResults);
    }

    // Check vegetarian recipes
    if (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes('vegetarian'))) {
      const vegResults = await this.checkVegetarianAchievements(userId);
      results.push(...vegResults);
    }

    return results;
  }

  /**
   * Check meal cooking achievements
   * @param {string} userId - User ID
   * @param {Object} meal - Meal data
   */
  static async checkMealCookingAchievements(userId, meal) {
    const results = [];

    // Check first meal cooked
    const firstMeal = await this.checkAchievement(userId, 'first-meal-cooked');
    if (firstMeal) results.push(firstMeal);

    // Check different recipes cooked
    const uniqueRecipesCooked = await this.getUniqueRecipesCooked(userId);
    if (uniqueRecipesCooked === 5) {
      const chefTraining = await this.checkAchievement(userId, 'different-recipes-cooked-5');
      if (chefTraining) results.push(chefTraining);
    }
    if (uniqueRecipesCooked === 10) {
      const seasonedChef = await this.checkAchievement(userId, 'different-recipes-cooked-10');
      if (seasonedChef) results.push(seasonedChef);
    }

    // Check time-based achievements
    const cookingHour = new Date().getHours();
    if (cookingHour >= 22) {
      const nightOwl = await this.checkAchievement(userId, 'night-owl-cooking');
      if (nightOwl) results.push(nightOwl);
    }
    if (cookingHour < 8) {
      const earlyBird = await this.checkAchievement(userId, 'early-bird-cooking');
      if (earlyBird) results.push(earlyBird);
    }

    // Check consecutive cooking days
    const consecutiveResults = await this.checkConsecutiveCookingDays(userId);
    results.push(...consecutiveResults);

    // Check meals per day
    const mealsPerDayResults = await this.checkMealsPerDay(userId);
    results.push(...mealsPerDayResults);

    return results;
  }

  /**
   * Check shopping list achievements
   * @param {string} userId - User ID
   * @param {Array} shoppingList - Shopping list items
   */
  static async checkShoppingListAchievements(userId, shoppingList) {
    const results = [];

    // Check first shopping item
    const firstItem = await this.checkAchievement(userId, 'first-shopping-item');
    if (firstItem) results.push(firstItem);

    // Check completed shopping lists
    const completedItems = shoppingList.filter(item => item.completed);
    if (completedItems.length > 0) {
      const firstComplete = await this.checkAchievement(userId, 'first-shopping-complete');
      if (firstComplete) results.push(firstComplete);

      const completedCount = await this.getCompletedShoppingListsCount(userId);
      if (completedCount === 10) {
        const groceryGuru = await this.checkAchievement(userId, 'shopping-lists-completed-10');
        if (groceryGuru) results.push(groceryGuru);
      }
    }

    return results;
  }

  /**
   * Check pantry achievements
   * @param {string} userId - User ID
   * @param {Object} pantry - Pantry data
   */
  static async checkPantryAchievements(userId, pantry) {
    const results = [];

    // Check first pantry item
    const firstItem = await this.checkAchievement(userId, 'first-pantry-item');
    if (firstItem) results.push(firstItem);

    // Check unique pantry items
    const uniqueItems = await this.getUniquePantryItemsCount(userId);
    if (uniqueItems === 20) {
      const pantryPro = await this.checkAchievement(userId, 'pantry-items-20');
      if (pantryPro) results.push(pantryPro);
    }

    // Check total pantry items
    const totalItems = await this.getTotalPantryItemsCount(userId);
    if (totalItems === 50) {
      const stockMaster = await this.checkAchievement(userId, 'total-pantry-items-50');
      if (stockMaster) results.push(stockMaster);
    }

    return results;
  }

  /**
   * Check meal planning achievements
   * @param {string} userId - User ID
   */
  static async checkMealPlanningAchievements(userId) {
    const results = [];

    // Check first meal plan
    const firstPlan = await this.checkAchievement(userId, 'first-meal-plan');
    if (firstPlan) results.push(firstPlan);

    // Check full week planning
    const weekMeals = await this.getWeekMealsCount(userId);
    if (weekMeals >= 7) {
      const weeklyWarrior = await this.checkAchievement(userId, 'full-week-planned');
      if (weeklyWarrior) results.push(weeklyWarrior);
    }

    return results;
  }

  /**
   * Check milestone achievements
   * @param {string} userId - User ID
   */
  static async checkMilestoneAchievements(userId) {
    const results = [];

    const completedCount = await this.getCompletedAchievementsCount(userId);
    
    if (completedCount === 10) {
      const bronze = await this.checkAchievement(userId, 'bronze-chef');
      if (bronze) results.push(bronze);
    }
    if (completedCount === 25) {
      const silver = await this.checkAchievement(userId, 'silver-chef');
      if (silver) results.push(silver);
    }
    if (completedCount === 50) {
      const gold = await this.checkAchievement(userId, 'gold-chef');
      if (gold) results.push(gold);
    }

    return results;
  }

  // Helper methods for getting counts
  static async getUserRecipeCount(userId) {
    return await Recipe.countDocuments({ createdBy: userId });
  }

  static async getUniqueRecipesCooked(userId) {
    const cookedMeals = await MealPlan.find({ user: userId, cooked: true });
    const uniqueRecipeIds = new Set(cookedMeals.map(meal => meal.recipe.toString()));
    return uniqueRecipeIds.size;
  }

  static async getCompletedShoppingListsCount(userId) {
    // Count how many times user has completed shopping lists
    // This is a simplified version - you might want to track this differently
    const completedItems = await ShoppingListItem.find({ user: userId, completed: true });
    return Math.floor(completedItems.length / 5); // Assume 5 items per shopping list
  }

  static async getUniquePantryItemsCount(userId) {
    const pantry = await Pantry.findOne({ user: userId });
    if (!pantry) return 0;
    
    const uniqueIngredientIds = new Set(pantry.items.map(item => item.ingredient.toString()));
    return uniqueIngredientIds.size;
  }

  static async getTotalPantryItemsCount(userId) {
    const pantry = await Pantry.findOne({ user: userId });
    if (!pantry) return 0;
    
    return pantry.items.reduce((total, item) => total + item.quantity, 0);
  }

  static async getWeekMealsCount(userId) {
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return await MealPlan.countDocuments({
      user: userId,
      weekStart: { $gte: weekStart, $lt: weekEnd }
    });
  }

  static async getCompletedAchievementsCount(userId) {
    return await Achievement.countDocuments({ userId, completed: true });
  }

  static async checkCuisineAchievements(userId) {
    const results = [];
    
    // Get all user recipes
    const recipes = await Recipe.find({ createdBy: userId });
    const cuisines = new Set();
    
    recipes.forEach(recipe => {
      if (recipe.tags) {
        recipe.tags.forEach(tag => {
          const lowerTag = tag.toLowerCase();
          if (lowerTag.includes('italian') || lowerTag.includes('chinese') || 
              lowerTag.includes('mexican') || lowerTag.includes('indian') || 
              lowerTag.includes('japanese') || lowerTag.includes('french') ||
              lowerTag.includes('thai') || lowerTag.includes('greek')) {
            cuisines.add(tag);
          }
        });
      }
    });
    
    if (cuisines.size >= 5) {
      const worldCuisine = await this.checkAchievement(userId, 'world-cuisine');
      if (worldCuisine) results.push(worldCuisine);
    }
    
    return results;
  }

  static async checkDessertAchievements(userId) {
    const results = [];
    
    const dessertRecipes = await Recipe.countDocuments({
      createdBy: userId,
      category: 'Dessert'
    });
    
    if (dessertRecipes >= 5) {
      const sweetTooth = await this.checkAchievement(userId, 'sweet-tooth');
      if (sweetTooth) results.push(sweetTooth);
    }
    
    return results;
  }

  static async checkPizzaAchievements(userId) {
    const results = [];
    
    const pizzaRecipes = await Recipe.countDocuments({
      createdBy: userId,
      name: { $regex: /pizza/i }
    });
    
    if (pizzaRecipes >= 3) {
      const pizzaLover = await this.checkAchievement(userId, 'pizza-lover');
      if (pizzaLover) results.push(pizzaLover);
    }
    
    return results;
  }

  static async checkVegetarianAchievements(userId) {
    const results = [];
    
    const vegetarianRecipes = await Recipe.countDocuments({
      createdBy: userId,
      tags: { $regex: /vegetarian/i }
    });
    
    if (vegetarianRecipes >= 10) {
      const healthNut = await this.checkAchievement(userId, 'health-nut');
      if (healthNut) results.push(healthNut);
    }
    
    return results;
  }

  static async checkConsecutiveCookingDays(userId) {
    const results = [];
    
    // Get all cooked meals in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const cookedMeals = await MealPlan.find({
      user: userId,
      cooked: true,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });
    
    // Find longest consecutive streak
    let currentStreak = 0;
    let maxStreak = 0;
    let lastDate = null;
    
    cookedMeals.forEach(meal => {
      const mealDate = new Date(meal.createdAt).toDateString();
      
      if (!lastDate || new Date(meal.createdAt) - new Date(lastDate) <= 24 * 60 * 60 * 1000) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
      
      lastDate = meal.createdAt;
    });
    
    if (maxStreak >= 7) {
      const consistentCook = await this.checkAchievement(userId, 'consecutive-cooking-7');
      if (consistentCook) results.push(consistentCook);
    }
    
    return results;
  }

  static async checkMealsPerDay(userId) {
    const results = [];
    
    // Check if user cooked 3 meals in one day
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const todayMeals = await MealPlan.countDocuments({
      user: userId,
      cooked: true,
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });
    
    if (todayMeals >= 3) {
      const mealPrepPro = await this.checkAchievement(userId, 'three-meals-one-day');
      if (mealPrepPro) results.push(mealPrepPro);
    }
    
    return results;
  }
}

module.exports = AchievementService; 