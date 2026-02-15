const Achievement = require('../models/achievement');
const achievements = require('../config/achievements');
const Recipe = require('../models/recipe');
const MealPlan = require('../models/mealPlan');
const Pantry = require('../models/pantry');
const ShoppingListItem = require('../models/shopping-list-item');
const User = require('../models/user');

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
   * @param {string} progressMode - 'add' (default) to add progress, 'set' to set progress to max(current, progress)
   * @returns {Promise<Object>} - Achievement update result
   */
  static async checkAchievement(userId, achievementId, progress = 1, progressMode = 'add') {
    try {
      const achievementConfig = achievements[achievementId];
      if (!achievementConfig) {
        return null;
      }

      // Find or create achievement record
      let achievement = await Achievement.findOne({ userId, achievementId });
      
      if (!achievement) {
        // Create new achievement record
        const initialProgress = Math.min(progress, achievementConfig.requiredProgress);
        achievement = new Achievement({
          userId,
          achievementId,
          name: achievementConfig.name,
          description: achievementConfig.description,
          category: achievementConfig.category,
          icon: achievementConfig.icon,
          progress: initialProgress,
          requiredProgress: achievementConfig.requiredProgress,
          completed: initialProgress >= achievementConfig.requiredProgress,
          completedAt: initialProgress >= achievementConfig.requiredProgress ? new Date() : null
        });
      } else {
        // Update existing achievement
        let newProgress;
        if (progressMode === 'set') {
          newProgress = Math.min(Math.max(achievement.progress, progress), achievementConfig.requiredProgress);
        } else {
          newProgress = Math.min(achievement.progress + progress, achievementConfig.requiredProgress);
        }
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

    // Check milestone achievements
    const milestoneResults = await this.checkMilestoneAchievements(userId);
    results.push(...milestoneResults);

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

    // Check recipe count achievements (use >= so we don't miss when user creates 6+ at once)
    const recipeCount = await this.getUserRecipeCount(userId);
    if (recipeCount >= 5) {
      const collector = await this.checkAchievement(userId, 'recipes-created-5', recipeCount, 'set');
      if (collector) results.push(collector);
    }
    if (recipeCount >= 10) {
      const master = await this.checkAchievement(userId, 'recipes-created-10', recipeCount, 'set');
      if (master) results.push(master);
    }

    // Check milestone achievements
    const milestoneResults = await this.checkMilestoneAchievements(userId);
    results.push(...milestoneResults);

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

    // Check different recipes cooked (pass actual count with set mode so progress tracks correctly)
    const uniqueRecipesCooked = await this.getUniqueRecipesCooked(userId);
    if (uniqueRecipesCooked >= 5) {
      const chefTraining = await this.checkAchievement(userId, 'different-recipes-cooked-5', uniqueRecipesCooked, 'set');
      if (chefTraining) results.push(chefTraining);
    }
    if (uniqueRecipesCooked >= 10) {
      const seasonedChef = await this.checkAchievement(userId, 'different-recipes-cooked-10', uniqueRecipesCooked, 'set');
      if (seasonedChef) results.push(seasonedChef);
    }



    // Check consecutive cooking days
    const consecutiveResults = await this.checkConsecutiveCookingDays(userId);
    results.push(...consecutiveResults);

    // Check meals per day
    const mealsPerDayResults = await this.checkMealsPerDay(userId);
    results.push(...mealsPerDayResults);

    // Check milestone achievements
    const milestoneResults = await this.checkMilestoneAchievements(userId);
    results.push(...milestoneResults);

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
    const totalItems = shoppingList.length;
    // "First shopping complete" = all items in list are completed
    if (totalItems > 0 && completedItems.length === totalItems) {
      const firstComplete = await this.checkAchievement(userId, 'first-shopping-complete');
      if (firstComplete) results.push(firstComplete);
    }

    const completedCount = await this.getCompletedShoppingListsCount(userId);
    if (completedCount >= 10) {
      const groceryGuru = await this.checkAchievement(userId, 'shopping-lists-completed-10', completedCount, 'set');
      if (groceryGuru) results.push(groceryGuru);
    }

    // Check milestone achievements
    const milestoneResults = await this.checkMilestoneAchievements(userId);
    results.push(...milestoneResults);

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

    // Check unique pantry items (use >= so we don't miss when user adds many at once)
    const uniqueItems = await this.getUniquePantryItemsCount(userId);
    if (uniqueItems >= 20) {
      const pantryPro = await this.checkAchievement(userId, 'pantry-items-20', uniqueItems, 'set');
      if (pantryPro) results.push(pantryPro);
    }

    // Check total pantry items
    const totalItems = await this.getTotalPantryItemsCount(userId);
    if (totalItems >= 50) {
      const stockMaster = await this.checkAchievement(userId, 'total-pantry-items-50', totalItems, 'set');
      if (stockMaster) results.push(stockMaster);
    }

    // Check milestone achievements
    const milestoneResults = await this.checkMilestoneAchievements(userId);
    results.push(...milestoneResults);

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

    // Check full week planning (all 21 slots)
    const weekMeals = await this.getWeekMealsCount(userId);
    if (weekMeals >= 21) {
      const weeklyWarrior = await this.checkAchievement(userId, 'full-week-planned');
      if (weeklyWarrior) results.push(weeklyWarrior);
    }

    // Check milestone achievements
    const milestoneResults = await this.checkMilestoneAchievements(userId);
    results.push(...milestoneResults);

    return results;
  }

  /**
   * Check milestone achievements
   * @param {string} userId - User ID
   */
  static async checkMilestoneAchievements(userId) {
    const results = [];

    const completedCount = await this.getCompletedAchievementsCount(userId);
    
    // Check Bronze Chef (5 achievements)
    if (completedCount >= 5) {
      const bronze = await this.checkAchievement(userId, 'bronze-chef', completedCount);
      if (bronze) results.push(bronze);
    }
    
    // Check Silver Chef (10 achievements)
    if (completedCount >= 10) {
      const silver = await this.checkAchievement(userId, 'silver-chef', completedCount);
      if (silver) results.push(silver);
    }
    
    // Check Gold Chef (15 achievements)
    if (completedCount >= 15) {
      const gold = await this.checkAchievement(userId, 'gold-chef', completedCount);
      if (gold) results.push(gold);
    }

    // Check Master Chef (all achievements - 17 non-milestone achievements)
    if (completedCount >= 17) {
      const master = await this.checkAchievement(userId, 'master-chef', completedCount);
      if (master) results.push(master);
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
    // Count how many times user has cleared completed items (each clear = 1 completed shopping trip)
    const user = await User.findById(userId).select('completedShoppingListsCount');
    return user?.completedShoppingListsCount ?? 0;
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
    // Use Monday as week start to match MealPlan schema (weekStart is Monday)
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Find all meal plans for the user in the current week
    const meals = await MealPlan.find({
      user: userId,
      weekStart: { $gte: weekStart, $lt: weekEnd }
    });
    // Count unique (day, meal) pairs (21 = 7 days × 3 meals for full week)
    const uniqueSlots = new Set(meals.map(m => `${m.day}|${m.meal}`));
    return uniqueSlots.size;
  }

  static async getCompletedAchievementsCount(userId) {
    return await Achievement.countDocuments({ userId, completed: true });
  }



  static async checkConsecutiveCookingDays(userId) {
    const results = [];
    
    // Get all cooked meals (any time) - we need unique dates for consecutive day streak
    const cookedMeals = await MealPlan.find({
      user: userId,
      cooked: true
    }).sort({ createdAt: 1 });
    
    // Get unique dates when user cooked
    const cookedDates = [...new Set(cookedMeals.map(m => new Date(m.createdAt).toDateString()))].sort();
    
    // Find longest consecutive day streak
    let maxStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < cookedDates.length; i++) {
      const prev = new Date(cookedDates[i - 1]);
      const curr = new Date(cookedDates[i]);
      const dayDiff = Math.round((curr - prev) / (24 * 60 * 60 * 1000));
      
      if (dayDiff === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    
    if (maxStreak >= 7) {
      const consistentCook = await this.checkAchievement(userId, 'consecutive-cooking-7', maxStreak, 'set');
      if (consistentCook) results.push(consistentCook);
    }
    
    return results;
  }

  static async checkMealsPerDay(userId) {
    const results = [];
    
    // Check if user ever cooked 3+ meals in one day (aggregate by date)
    const cookedMeals = await MealPlan.find({ user: userId, cooked: true });
    const mealsByDate = {};
    cookedMeals.forEach(meal => {
      const dateStr = new Date(meal.createdAt).toDateString();
      mealsByDate[dateStr] = (mealsByDate[dateStr] || 0) + 1;
    });
    
    const maxMealsInOneDay = Math.max(0, ...Object.values(mealsByDate));
    
    if (maxMealsInOneDay >= 3) {
      const mealPrepPro = await this.checkAchievement(userId, 'three-meals-one-day', maxMealsInOneDay, 'set');
      if (mealPrepPro) results.push(mealPrepPro);
    }
    
    return results;
  }
}

module.exports = AchievementService; 