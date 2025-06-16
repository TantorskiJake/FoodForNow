const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ShoppingListItem = require('../models/shopping-list-item');
const Recipe = require('../models/recipe');
const PantryItem = require('../models/pantry');
const Ingredient = require('../models/ingredient');
const MealPlan = require('../models/mealPlan');

// Get shopping list
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching shopping list for user:', req.userId);
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
    console.log('Adding item to shopping list:', req.body);
    const { ingredient, quantity, unit } = req.body;

    // Validate required fields
    if (!ingredient || !quantity || !unit) {
      return res.status(400).json({ error: 'Ingredient, quantity, and unit are required' });
    }

    // Validate unit
    const validUnits = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch'];
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
    res.status(201).json(shoppingListItem);
  } catch (err) {
    console.error('Error adding item to shopping list:', err);
    res.status(500).json({ error: 'Failed to add item to shopping list' });
  }
});

// Update shopping list based on meal plan
router.post('/update-from-meal-plan', authMiddleware, async (req, res) => {
  try {
    console.log('Updating shopping list from meal plan for user:', req.userId);
    
    // Get all meal plans for the user with populated recipe ingredients
    const mealPlans = await MealPlan.find({ user: req.userId })
      .populate({
        path: 'recipe',
        populate: {
          path: 'ingredients.ingredient',
          model: 'Ingredient'
        }
      });

    console.log('Found meal plans:', mealPlans.length);

    if (mealPlans.length === 0) {
      return res.json([]);
    }

    // Get current pantry items
    const pantryItems = await PantryItem.find({ user: req.userId });

    console.log('Found pantry items:', pantryItems.length);

    // Create a map of current pantry quantities
    const pantryQuantities = new Map();
    pantryItems.forEach(item => {
      if (item.ingredient) {
        pantryQuantities.set(item.ingredient.toString(), item.quantity);
      }
    });

    // Calculate needed ingredients
    const neededIngredients = new Map();
    mealPlans.forEach(mealPlan => {
      if (!mealPlan.recipe || !mealPlan.recipe.ingredients) {
        console.log('Skipping meal plan with no recipe or ingredients:', mealPlan._id);
        return;
      }

      console.log('Processing recipe:', mealPlan.recipe.name);
      console.log('Recipe ingredients:', JSON.stringify(mealPlan.recipe.ingredients, null, 2));

      mealPlan.recipe.ingredients.forEach(ing => {
        if (!ing.ingredient) {
          console.log('Skipping ingredient with no reference:', ing);
          return;
        }

        const ingredientId = ing.ingredient._id || ing.ingredient;
        if (!ingredientId) {
          console.log('Skipping ingredient with no ID:', ing);
          return;
        }

        const key = ingredientId.toString();
        const currentQuantity = pantryQuantities.get(key) || 0;
        const neededQuantity = ing.quantity - currentQuantity;
        
        if (neededQuantity > 0) {
          if (!neededIngredients.has(key)) {
            neededIngredients.set(key, {
              ingredient: ingredientId,
              quantity: neededQuantity,
              unit: ing.unit,
              recipe: mealPlan.recipe._id
            });
          } else {
            const existing = neededIngredients.get(key);
            existing.quantity += neededQuantity;
          }
        }
      });
    });

    console.log('Calculated needed ingredients:', neededIngredients.size);
    console.log('Needed ingredients:', Array.from(neededIngredients.entries()));

    // Update shopping list
    await ShoppingListItem.deleteMany({ user: req.userId });
    
    const shoppingListItems = Array.from(neededIngredients.values()).map(item => ({
      user: req.userId,
      ingredient: item.ingredient,
      quantity: item.quantity,
      unit: item.unit,
      recipe: item.recipe,
      completed: false
    }));

    console.log('Creating shopping list items:', shoppingListItems.length);
    console.log('Shopping list items:', JSON.stringify(shoppingListItems, null, 2));

    if (shoppingListItems.length > 0) {
      await ShoppingListItem.insertMany(shoppingListItems);
    }

    // Return success response
    res.json({ message: 'Shopping list updated successfully', count: shoppingListItems.length });
  } catch (err) {
    console.error('Error updating shopping list:', err);
    res.status(500).json({ message: 'Error updating shopping list' });
  }
});

// Toggle item completion
router.put('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    console.log('Toggling shopping list item:', req.params.id);
    const item = await ShoppingListItem.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.completed = !item.completed;
    await item.save();

    res.json(item);
  } catch (err) {
    console.error('Error toggling item:', err);
    res.status(500).json({ message: 'Error toggling item' });
  }
});

// Remove item from shopping list
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Removing shopping list item:', req.params.id);
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

// Clear completed items
router.delete('/clear-completed', authMiddleware, async (req, res) => {
  try {
    console.log('Clearing completed items for user:', req.userId);
    await ShoppingListItem.deleteMany({
      user: req.userId,
      completed: true
    });
    res.json({ message: 'Completed items cleared' });
  } catch (err) {
    console.error('Error clearing completed items:', err);
    res.status(500).json({ message: 'Error clearing completed items' });
  }
});

module.exports = router; 