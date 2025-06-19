const express = require('express');
const authMiddleware = require('../middleware/auth');
const MealPlan = require('../models/mealPlan');
const Recipe = require('../models/recipe');

const router = express.Router();

// Get meal plan for a specific week
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching meal plan for user:', req.userId);
    const mealPlan = await MealPlan.find({ user: req.userId }).populate('recipe');
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

    // Get user's pantry
    const Pantry = require('../models/pantry');
    const pantry = await Pantry.findOne({ user: req.userId });
    
    if (!pantry) {
      return res.status(404).json({ error: 'Pantry not found' });
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
        const shoppingListItem = new ShoppingListItem({
          user: req.userId,
          ingredient: missing.ingredient._id,
          quantity: missing.quantity,
          unit: missing.unit,
          completed: false
        });
        await shoppingListItem.save();
      }
    }

    // Update pantry - remove ingredients
    for (const update of pantryUpdates) {
      const pantryItem = pantry.items.id(update.itemId);
      if (pantryItem) {
        pantryItem.quantity -= update.removeQuantity;
        if (pantryItem.quantity <= 0) {
          // Remove item if quantity is 0 or less
          pantry.items = pantry.items.filter(item => item._id.toString() !== update.itemId);
        }
      }
    }

    await pantry.save();

    // Mark meal as cooked
    mealPlanItem.cooked = true;
    await mealPlanItem.save();
    await mealPlanItem.populate('recipe');

    res.json({
      mealPlanItem,
      removedIngredients: pantryUpdates.length,
      addedToShoppingList: missingIngredients.length
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
    
    // Get all meal plans for the user
    const mealPlans = await MealPlan.find({ user: req.userId })
      .populate({
        path: 'recipe',
        populate: {
          path: 'ingredients.ingredient'
        }
      });

    console.log('Found meal plans:', mealPlans.length);

    // Aggregate needed ingredients (by ingredient+unit)
    const ingredients = new Map();
    mealPlans.forEach(mealPlan => {
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

    console.log('Aggregated ingredients:', result.length);
    res.json(result);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ error: 'Failed to fetch ingredients', details: error.message });
  }
});

module.exports = router; 