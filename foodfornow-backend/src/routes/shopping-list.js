const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ShoppingListItem = require('../models/shopping-list-item');
const Recipe = require('../models/recipe');
const PantryItem = require('../models/pantry');
const Ingredient = require('../models/ingredient');
const MealPlan = require('../models/mealPlan');
const { isAlwaysAvailableIngredient } = require('../constants/ingredients');

// Get shopping list
router.get('/', authMiddleware, async (req, res) => {
  try {
    const items = await ShoppingListItem.find({ user: req.userId })
      .populate('ingredient')
      .populate('recipe')
      .sort({ 'ingredient.category': 1, 'ingredient.name': 1 });
    res.json(items);
  } catch (err) {
    console.error('Error fetching shopping list:', err);
    res.status(500).json({ message: 'Error fetching shopping list' });
  }
});

// Add item to shopping list
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { ingredient, quantity, unit } = req.body;

    // Validate required fields
    if (!ingredient || !quantity || !unit) {
      return res.status(400).json({ error: 'Ingredient, quantity, and unit are required' });
    }

    // Validate unit
    const validUnits = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'box'];
    if (!validUnits.includes(unit)) {
      return res.status(400).json({ error: `Invalid unit. Must be one of: ${validUnits.join(', ')}` });
    }

    // Validate ingredient exists
    const validIngredient = await Ingredient.findById(ingredient);
    if (!validIngredient) {
      return res.status(400).json({ error: 'Invalid ingredient ID' });
    }

    // Create a new shopping list item
    const shoppingListItem = new ShoppingListItem({
      user: req.userId,
      ingredient: ingredient,
      quantity: Number(quantity),
      unit: unit,
      completed: false
    });

    await shoppingListItem.save();
    await shoppingListItem.populate('ingredient');

    // Check for first-shopping-item achievement
    try {
      const AchievementService = require('../services/achievementService');
      const achievements = await AchievementService.checkShoppingListAchievements(req.userId, [shoppingListItem]);
      if (achievements && achievements.length > 0) {
        const newlyCompleted = achievements.filter(a => a.newlyCompleted);
        if (newlyCompleted.length > 0) {
          return res.status(201).json({
            item: shoppingListItem,
            achievements: newlyCompleted.map(a => ({
              name: a.config.name,
              description: a.config.description,
              icon: a.config.icon
            }))
          });
        }
      }
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
    }

    res.status(201).json(shoppingListItem);
  } catch (err) {
    console.error('Error adding item to shopping list:', err);
    res.status(500).json({ error: 'Failed to add item to shopping list' });
  }
});

// Update shopping list based on meal plan
router.post('/update-from-meal-plan', authMiddleware, async (req, res) => {
  try {
    // Step 1: Get all meal plans for the user with populated recipe ingredients
    const mealPlans = await MealPlan.find({ user: req.userId })
      .populate({
        path: 'recipe',
        populate: {
          path: 'ingredients.ingredient',
          model: 'Ingredient',
          select: 'name category'
        }
      });

    const uncookedMealPlans = mealPlans.filter(mealPlan => !mealPlan.cooked);
    if (uncookedMealPlans.length === 0) {
      return res.json([]);
    }

    // Step 2: Get current pantry items
    const pantry = await PantryItem.findOne({ user: req.userId })
      .populate({
        path: 'items.ingredient',
        model: 'Ingredient',
        select: 'name category'
      });

    // Step 3: Create a map of current pantry quantities
    const pantryQuantities = new Map();
    if (pantry && pantry.items) {
      pantry.items.forEach(item => {
        if (item.ingredient) {
          const key = `${item.ingredient._id}-${item.unit}`;
          pantryQuantities.set(key, item.quantity);
        }
      });
    }

    // Step 4: Calculate needed ingredients
    const neededIngredients = new Map();
    uncookedMealPlans.forEach(mealPlan => {
      if (!mealPlan.recipe || !mealPlan.recipe.ingredients) return;
      mealPlan.recipe.ingredients.forEach(ing => {
        if (!ing.ingredient) return;
        if (isAlwaysAvailableIngredient(ing.ingredient.name)) return;
        const ingredientId = ing.ingredient._id || ing.ingredient;
        if (!ingredientId) return;
        const key = `${ingredientId}-${ing.unit}`;
        const pantryQuantity = pantryQuantities.get(key) || 0;
        const neededQuantity = ing.quantity;
        
        if (!neededIngredients.has(key)) {
          neededIngredients.set(key, {
            ingredient: ingredientId,
            quantity: neededQuantity,
            unit: ing.unit,
            recipe: mealPlan.recipe._id,
            pantryQuantity: pantryQuantity,
            totalNeeded: neededQuantity
          });
        } else {
          const existing = neededIngredients.get(key);
          existing.quantity += neededQuantity;
          existing.totalNeeded += neededQuantity;
        }
      });
    });
    // Step 5: Update shopping list
    await ShoppingListItem.deleteMany({ user: req.userId });
    
    const shoppingListItems = Array.from(neededIngredients.values())
      .map(item => {
        // Subtract pantry quantity from total needed
        const remainingNeeded = Math.max(0, item.quantity - item.pantryQuantity);
        return {
          user: req.userId,
          ingredient: item.ingredient,
          quantity: remainingNeeded,
          unit: item.unit,
          recipe: item.recipe,
          completed: false
        };
      })
      .filter(item => item.quantity > 0); // Only include items that still need to be bought
    if (shoppingListItems.length > 0) {
      await ShoppingListItem.insertMany(shoppingListItems);
    }

    // Step 6: Return updated shopping list
    const updatedList = await ShoppingListItem.find({ user: req.userId })
      .populate('ingredient')
      .populate('recipe');

    // Add pantry quantities to the response
    const pantryResponse = await PantryItem.findOne({ user: req.userId })
      .populate('items.ingredient');

    const pantryQuantitiesResponse = new Map();
    if (pantryResponse && pantryResponse.items) {
      pantryResponse.items.forEach(item => {
        if (item.ingredient) {
          const key = `${item.ingredient._id}-${item.unit}`;
          pantryQuantitiesResponse.set(key, item.quantity);
        }
      });
    }

    const responseWithPantryQuantities = updatedList.map(item => {
      const key = `${item.ingredient._id}-${item.unit}`;
      const pantryQuantity = pantryQuantitiesResponse.get(key) || 0;
      return {
        ...item.toObject(),
        pantryQuantity
      };
    });

    // Check for shopping list-related achievements
    try {
      const AchievementService = require('../services/achievementService');
      const achievements = await AchievementService.checkShoppingListAchievements(req.userId, responseWithPantryQuantities);
      
      // Add achievement data to response if any were unlocked
      if (achievements && achievements.length > 0) {
        const newlyCompleted = achievements.filter(a => a.newlyCompleted);
        if (newlyCompleted.length > 0) {
          res.json({
            shoppingList: responseWithPantryQuantities,
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

    res.json(responseWithPantryQuantities);
  } catch (error) {
    console.error('Error updating shopping list:', error);
    res.status(500).json({ error: 'Failed to update shopping list' });
  }
});

// Toggle item completion
router.put('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const item = await ShoppingListItem.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.completed = !item.completed;
    await item.save();

    // Check for shopping list-related achievements
    try {
      const AchievementService = require('../services/achievementService');
      const achievements = await AchievementService.checkShoppingListAchievements(req.userId, [item]);
      
      // Add achievement data to response if any were unlocked
      if (achievements && achievements.length > 0) {
        const newlyCompleted = achievements.filter(a => a.newlyCompleted);
        if (newlyCompleted.length > 0) {
          res.json({
            item,
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

    res.json(item);
  } catch (err) {
    console.error('Error toggling item:', err);
    res.status(500).json({ message: 'Error toggling item' });
  }
});

// Clear completed items (counts as 1 completed shopping list for achievements)
// NOTE: Must be defined BEFORE /:id route - otherwise "clear-completed" is matched as an id
router.delete('/clear-completed', authMiddleware, async (req, res) => {
  try {
    const deletedCount = await ShoppingListItem.countDocuments({
      user: req.userId,
      completed: true
    });

    await ShoppingListItem.deleteMany({
      user: req.userId,
      completed: true
    });

    // Increment completed shopping lists count when user clears (had completed items)
    if (deletedCount > 0) {
      const User = require('../models/user');
      await User.findByIdAndUpdate(req.userId, { $inc: { completedShoppingListsCount: 1 } });

      // Check for shopping list achievements
      try {
        const AchievementService = require('../services/achievementService');
        const achievements = await AchievementService.checkShoppingListAchievements(req.userId, []);
        if (achievements && achievements.length > 0) {
          const newlyCompleted = achievements.filter(a => a.newlyCompleted);
          if (newlyCompleted.length > 0) {
            return res.json({
              message: 'Completed items cleared',
              achievements: newlyCompleted.map(a => ({
                name: a.config.name,
                description: a.config.description,
                icon: a.config.icon
              }))
            });
          }
        }
      } catch (achievementError) {
        console.error('Error checking achievements:', achievementError);
      }
    }

    res.json({ message: 'Completed items cleared' });
  } catch (err) {
    console.error('Error clearing completed items:', err);
    res.status(500).json({ message: 'Error clearing completed items' });
  }
});

// Remove item from shopping list
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await ShoppingListItem.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item removed from shopping list' });
  } catch (err) {
    console.error('Error removing item:', err);
    res.status(500).json({ message: 'Error removing item' });
  }
});

// Update fields of a shopping list item
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await ShoppingListItem.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check for shopping list-related achievements
    try {
      const AchievementService = require('../services/achievementService');
      const achievements = await AchievementService.checkShoppingListAchievements(req.userId, [item]);
      
      // Add achievement data to response if any were unlocked
      if (achievements && achievements.length > 0) {
        const newlyCompleted = achievements.filter(a => a.newlyCompleted);
        if (newlyCompleted.length > 0) {
          res.json({
            item,
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

    res.json(item);
  } catch (err) {
    console.error('Error updating shopping list item:', err);
    res.status(500).json({ message: 'Error updating shopping list item' });
  }
});

// Clear all shopping list items
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await ShoppingListItem.deleteMany({ user: req.userId });
    res.json({ message: 'Shopping list cleared successfully' });
  } catch (err) {
    console.error('Error clearing shopping list:', err);
    res.status(500).json({ error: 'Failed to clear shopping list' });
  }
});

module.exports = router; 