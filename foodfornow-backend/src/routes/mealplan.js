const express = require('express');
const authMiddleware = require('../middleware/auth');
const MealPlan = require('../models/mealPlan');
const Recipe = require('../models/recipe');

const router = express.Router();

// Get meal plan for a specific week
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching meal plan for user:', req.userId);
    
    let query = { user: req.userId };
    
    // If weekStart is provided, filter by that week
    if (req.query.weekStart) {
      const weekStart = new Date(req.query.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      query.weekStart = {
        $gte: weekStart,
        $lt: weekEnd
      };
    }
    
    const mealPlan = await MealPlan.find(query).populate('recipe');
    console.log('Found meal plan:', mealPlan);
    res.json(mealPlan);
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    res.status(500).json({ error: 'Failed to fetch meal plan', details: error.message });
  }
});

// Add meal to plan
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Adding meal to plan:', req.body);
    const { weekStart, day, meal, recipeId, notes } = req.body;

    // Validate required fields
    if (!weekStart || !day || !meal || !recipeId) {
      return res.status(400).json({ error: 'Week start, day, meal, and recipe are required' });
    }

    // Verify recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Check if a meal already exists for this day and time
    const existingMeal = await MealPlan.findOne({
      user: req.userId,
      weekStart: new Date(weekStart),
      day,
      meal
    });

    if (existingMeal) {
      return res.status(400).json({ error: 'A meal already exists for this day and time' });
    }

    const mealPlanItem = new MealPlan({
      user: req.userId,
      weekStart: new Date(weekStart),
      day,
      meal,
      recipe: recipeId,
      notes
    });

    await mealPlanItem.save();
    console.log('Meal plan item saved:', mealPlanItem);
    
    // Check for meal planning achievements
    try {
      const AchievementService = require('../services/achievementService');
      const achievements = await AchievementService.checkMealPlanningAchievements(req.userId);
      
      // Add achievement data to response if any were unlocked
      if (achievements && achievements.length > 0) {
        const newlyCompleted = achievements.filter(a => a.newlyCompleted);
        if (newlyCompleted.length > 0) {
          await mealPlanItem.populate('recipe');
          res.status(201).json({
            mealPlanItem,
            achievements: newlyCompleted.map(a => ({
              name: a.config.name,
              description: a.config.description,
              icon: a.config.icon
            }))
          });
          return;
        }
      }
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
    }
    
    // Populate recipe details before sending response
    await mealPlanItem.populate('recipe');
    res.status(201).json(mealPlanItem);
  } catch (error) {
    console.error('Error adding meal to plan:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'A meal already exists for this day and time' });
    } else {
      res.status(500).json({ error: 'Failed to add meal to plan' });
    }
  }
});

// Update meal in plan
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { recipeId, notes } = req.body;
    
    // Verify recipe exists if being updated
    if (recipeId) {
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
    }

    const mealPlanItem = await MealPlan.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { 
        ...(recipeId && { recipe: recipeId }),
        ...(notes !== undefined && { notes })
      },
      { new: true }
    ).populate('recipe');

    if (!mealPlanItem) {
      return res.status(404).json({ error: 'Meal plan item not found' });
    }

    res.json(mealPlanItem);
  } catch (error) {
    console.error('Error updating meal plan item:', error);
    res.status(500).json({ error: 'Failed to update meal plan item' });
  }
});

// Toggle cooked status
router.patch('/:id/cooked', authMiddleware, async (req, res) => {
  try {
    const mealPlanItem = await MealPlan.findOne({ _id: req.params.id, user: req.userId });
    
    if (!mealPlanItem) {
      return res.status(404).json({ error: 'Meal plan item not found' });
    }

    mealPlanItem.cooked = !mealPlanItem.cooked;
    await mealPlanItem.save();
    
    await mealPlanItem.populate('recipe');
    res.json(mealPlanItem);
  } catch (error) {
    console.error('Error toggling cooked status:', error);
    res.status(500).json({ error: 'Failed to toggle cooked status' });
  }
});

// Reset week - delete all meal plans
router.delete('/reset-week', authMiddleware, async (req, res) => {
  try {
    console.log('Resetting week for user:', req.userId);
    
    let query = { user: req.userId };
    
    // If weekStart is provided, only delete meal plans for that week
    if (req.query.weekStart) {
      const weekStart = new Date(req.query.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      query.weekStart = {
        $gte: weekStart,
        $lt: weekEnd
      };
    }
    
    // Delete meal plans matching the query
    const result = await MealPlan.deleteMany(query);
    
    console.log(`Deleted ${result.deletedCount} meal plans`);
    
    res.json({
      message: `Reset week - deleted ${result.deletedCount} meal plans`,
      mealPlans: []
    });
  } catch (error) {
    console.error('Error resetting week:', error);
    res.status(500).json({ error: 'Failed to reset week' });
  }
});

// Cook a meal - remove ingredients from pantry and handle missing ingredients
router.patch('/:id/cook', authMiddleware, async (req, res) => {
  try {
    const { addMissingToShoppingList = false } = req.body;
    
    const mealPlanItem = await MealPlan.findOne({ _id: req.params.id, user: req.userId })
      .populate({
        path: 'recipe',
        populate: {
          path: 'ingredients.ingredient'
        }
      });
    
    if (!mealPlanItem) {
      return res.status(404).json({ error: 'Meal plan item not found' });
    }

    if (!mealPlanItem.recipe || !mealPlanItem.recipe.ingredients) {
      return res.status(400).json({ error: 'Recipe has no ingredients' });
    }

    const Pantry = require('../models/pantry');
    let pantry = await Pantry.findOne({ user: req.userId });
    // Auto-create pantry if it doesn't exist
    if (!pantry) {
      pantry = new Pantry({ user: req.userId, items: [] });
      await pantry.save();
    }

    const missingIngredients = [];
    const pantryUpdates = [];

    // Check each ingredient in the recipe
    for (const recipeIngredient of mealPlanItem.recipe.ingredients) {
      if (!recipeIngredient.ingredient) continue;

      const ingredientId = recipeIngredient.ingredient._id;
      const neededQuantity = recipeIngredient.quantity;
      const neededUnit = recipeIngredient.unit;

      // Find matching pantry item
      const pantryItem = pantry.items.find(item => 
        item.ingredient && 
        item.ingredient.toString() === ingredientId.toString() && 
        item.unit === neededUnit
      );

      if (!pantryItem || pantryItem.quantity < neededQuantity) {
        // Missing or insufficient ingredient
        const missingQuantity = pantryItem 
          ? Math.max(0, neededQuantity - pantryItem.quantity)
          : neededQuantity;
        
        missingIngredients.push({
          ingredient: recipeIngredient.ingredient,
          quantity: missingQuantity,
          unit: neededUnit,
          needed: neededQuantity,
          available: pantryItem ? pantryItem.quantity : 0
        });

        if (pantryItem && pantryItem.quantity > 0) {
          // Remove what we have
          pantryUpdates.push({
            itemId: pantryItem._id,
            removeQuantity: pantryItem.quantity
          });
        }
      } else {
        // We have enough, remove the needed quantity
        pantryUpdates.push({
          itemId: pantryItem._id,
          removeQuantity: neededQuantity
        });
      }
    }

    // If there are missing ingredients and user doesn't want to add to shopping list
    if (missingIngredients.length > 0 && !addMissingToShoppingList) {
      return res.status(400).json({
        error: 'Missing ingredients',
        missingIngredients,
        message: 'Some ingredients are missing from your pantry'
      });
    }

    // Add missing ingredients to shopping list if requested
    if (missingIngredients.length > 0 && addMissingToShoppingList) {
      const ShoppingListItem = require('../models/shopping-list-item');
      
      for (const missing of missingIngredients) {
        // Check if this ingredient already exists in the shopping list
        const existingItem = await ShoppingListItem.findOne({
          user: req.userId,
          ingredient: missing.ingredient._id,
          unit: missing.unit,
          completed: false
        });
        
        if (existingItem) {
          // Update existing item by adding the missing quantity
          existingItem.quantity += missing.quantity;
          await existingItem.save();
          console.log(`Updated existing shopping list item: ${missing.ingredient.name} - added ${missing.quantity} ${missing.unit}`);
        } else {
          // Create new shopping list item
          const shoppingListItem = new ShoppingListItem({
            user: req.userId,
            ingredient: missing.ingredient._id,
            quantity: missing.quantity,
            unit: missing.unit,
            completed: false
          });
          await shoppingListItem.save();
          console.log(`Created new shopping list item: ${missing.ingredient.name} - ${missing.quantity} ${missing.unit}`);
        }
      }
      
      // Don't mark as cooked if there were missing ingredients
      // Just return the meal plan item without changing cooked status
      await mealPlanItem.populate('recipe');
      return res.json({
        mealPlanItem,
        removedIngredients: pantryUpdates.length,
        addedToShoppingList: missingIngredients.length,
        message: 'Missing ingredients added to shopping list. Meal not marked as cooked.'
      });
    }

    // Update pantry - remove ingredients
    for (const update of pantryUpdates) {
      const pantryItem = pantry.items.id(update.itemId);
      if (pantryItem) {
        console.log(`Removing ${update.removeQuantity} from ${pantryItem.ingredient} (current: ${pantryItem.quantity})`);
        pantryItem.quantity -= update.removeQuantity;
        console.log(`New quantity: ${pantryItem.quantity}`);
        
        if (pantryItem.quantity <= 0) {
          // Remove item if quantity is 0 or less
          console.log(`Removing item with zero quantity: ${pantryItem.ingredient}`);
          pantry.items = pantry.items.filter(item => item._id.toString() !== update.itemId);
        }
      }
    }

    // Additional cleanup: remove any items that might have slipped through
    pantry.items = pantry.items.filter(item => item.quantity > 0);
    console.log(`Final pantry items count: ${pantry.items.length}`);

    await pantry.save();

    // Mark meal as cooked only if all ingredients were available
    mealPlanItem.cooked = true;
    await mealPlanItem.save();
    await mealPlanItem.populate('recipe');

    // Check for cooking-related achievements
    try {
      const AchievementService = require('../services/achievementService');
      const achievements = await AchievementService.checkMealCookingAchievements(req.userId, mealPlanItem);
      
      // Add achievement data to response if any were unlocked
      if (achievements && achievements.length > 0) {
        const newlyCompleted = achievements.filter(a => a.newlyCompleted);
        if (newlyCompleted.length > 0) {
          res.json({
            mealPlanItem,
            removedIngredients: pantryUpdates.length,
            addedToShoppingList: 0,
            achievements: newlyCompleted.map(a => ({
              name: a.config.name,
              description: a.config.description,
              icon: a.config.icon
            }))
          });
          return;
        }
      }
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
    }

    res.json({
      mealPlanItem,
      removedIngredients: pantryUpdates.length,
      addedToShoppingList: 0
    });

  } catch (error) {
    console.error('Error cooking meal:', error);
    res.status(500).json({ error: 'Failed to cook meal' });
  }
});

// Delete meal from plan
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Deleting meal plan item:', req.params.id);
    const mealPlanItem = await MealPlan.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    if (!mealPlanItem) {
      return res.status(404).json({ error: 'Meal plan item not found' });
    }
    res.json({ message: 'Meal plan item deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal plan item:', error);
    res.status(500).json({ error: 'Failed to delete meal plan item' });
  }
});

// Get ingredients needed for meal plans
router.get('/ingredients', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching ingredients for user:', req.userId);
    
    let query = { user: req.userId };
    
    // If weekStart is provided, filter by that week
    if (req.query.weekStart) {
      const weekStart = new Date(req.query.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      query.weekStart = {
        $gte: weekStart,
        $lt: weekEnd
      };
    }
    
    // Get meal plans for the user (filtered by week if specified)
    const mealPlans = await MealPlan.find(query)
      .populate({
        path: 'recipe',
        populate: {
          path: 'ingredients.ingredient'
        }
      });

    console.log('Found meal plans:', mealPlans.length);

    // Filter out cooked meals - only count ingredients from uncooked meals
    const uncookedMealPlans = mealPlans.filter(mealPlan => !mealPlan.cooked);
    console.log('Uncooked meal plans:', uncookedMealPlans.length);

    // Aggregate needed ingredients (by ingredient+unit) from uncooked meals only
    const ingredients = new Map();
    uncookedMealPlans.forEach(mealPlan => {
      if (mealPlan.recipe && mealPlan.recipe.ingredients) {
        mealPlan.recipe.ingredients.forEach(ing => {
          if (!ing.ingredient) return;
          const key = `${ing.ingredient._id.toString()}-${ing.unit}`;
          if (!ingredients.has(key)) {
            ingredients.set(key, {
              _id: ing.ingredient._id,
              name: ing.ingredient.name,
              category: ing.ingredient.category,
              quantity: ing.quantity,
              unit: ing.unit
            });
          } else {
            const existing = ingredients.get(key);
            existing.quantity += ing.quantity;
          }
        });
      }
    });

    // Fetch pantry and create a map of ingredient+unit to quantity
    const Pantry = require('../models/pantry');
    const pantry = await Pantry.findOne({ user: req.userId }).populate('items.ingredient');
    const pantryMap = new Map();
    if (pantry && pantry.items) {
      pantry.items.forEach(item => {
        if (item.ingredient) {
          const key = `${item.ingredient._id.toString()}-${item.unit}`;
          pantryMap.set(key, item.quantity);
        }
      });
    }

    // Add pantryQuantity to each ingredient
    const result = Array.from(ingredients.values()).map(ing => {
      const key = `${ing._id.toString()}-${ing.unit}`;
      return {
        ...ing,
        pantryQuantity: pantryMap.get(key) || 0
      };
    });

    console.log('Aggregated ingredients from uncooked meals:', result.length);
    res.json(result);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ error: 'Failed to fetch ingredients', details: error.message });
  }
});

// Populate week with random recipes
router.post('/populate-week', authMiddleware, async (req, res) => {
  try {
    console.log('Populating week with random recipes for user:', req.userId);
    
    // Get all recipes for the user
    const recipes = await Recipe.find({ createdBy: req.userId });
    
    if (recipes.length === 0) {
      return res.status(400).json({ error: 'No recipes found. Please add some recipes first.' });
    }

    // Use provided weekStart or calculate the start of the current week (Monday)
    let monday;
    if (req.body.weekStart) {
      // Parse the date string properly to avoid timezone issues
      const [year, month, day] = req.body.weekStart.split('-').map(Number);
      monday = new Date(year, month - 1, day); // month is 0-indexed
      monday.setHours(0, 0, 0, 0);
    } else {
      const today = new Date();
      monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + 1);
      monday.setHours(0, 0, 0, 0);
    }

    // Clear existing meal plan for the week
    await MealPlan.deleteMany({ 
      user: req.userId,
      weekStart: {
        $gte: monday,
        $lt: new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
    const newMealPlans = [];

    // Populate each meal slot with a random recipe
    for (const day of days) {
      for (const meal of mealTypes) {
        // Get a random recipe
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        
        const mealPlanItem = new MealPlan({
          user: req.userId,
          weekStart: monday,
          day,
          meal,
          recipe: randomRecipe._id
        });

        await mealPlanItem.save();
        await mealPlanItem.populate('recipe');
        newMealPlans.push(mealPlanItem);
      }
    }

    console.log(`Populated week with ${newMealPlans.length} meals`);
    
    res.json({
      message: `Week populated with ${newMealPlans.length} random recipes`,
      mealPlans: newMealPlans
    });
  } catch (error) {
    console.error('Error populating week:', error);
    res.status(500).json({ error: 'Failed to populate week' });
  }
});

module.exports = router; 