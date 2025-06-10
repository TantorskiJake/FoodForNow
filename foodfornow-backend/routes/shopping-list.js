const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ShoppingListItem = require('../models/shopping-list-item');
const Recipe = require('../models/recipe');
const PantryItem = require('../models/pantry');

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

// Update shopping list based on meal plan
router.post('/update-from-meal-plan', authMiddleware, async (req, res) => {
  try {
    console.log('Updating shopping list from meal plan for user:', req.userId);
    const { weekStart } = req.body;
    
    // Get all recipes from the meal plan for the week
    const mealPlanRecipes = await Recipe.find({
      'mealPlans.user': req.userId,
      'mealPlans.weekStart': weekStart
    }).populate('ingredients.ingredient');

    // Get current pantry items
    const pantryItems = await PantryItem.find({ user: req.userId })
      .populate('ingredient');

    // Create a map of current pantry quantities
    const pantryQuantities = new Map();
    pantryItems.forEach(item => {
      pantryQuantities.set(item.ingredient._id.toString(), item.quantity);
    });

    // Calculate needed ingredients
    const neededIngredients = new Map();
    mealPlanRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        const key = ing.ingredient._id.toString();
        const currentQuantity = pantryQuantities.get(key) || 0;
        const neededQuantity = ing.quantity - currentQuantity;
        
        if (neededQuantity > 0) {
          if (!neededIngredients.has(key)) {
            neededIngredients.set(key, {
              ingredient: ing.ingredient._id,
              quantity: neededQuantity,
              unit: ing.unit,
              recipe: recipe._id
            });
          } else {
            const existing = neededIngredients.get(key);
            existing.quantity += neededQuantity;
          }
        }
      });
    });

    // Update shopping list
    await ShoppingListItem.deleteMany({ user: req.userId });
    const shoppingListItems = Array.from(neededIngredients.values()).map(item => ({
      ...item,
      user: req.userId,
      completed: false
    }));

    if (shoppingListItems.length > 0) {
      await ShoppingListItem.insertMany(shoppingListItems);
    }

    const updatedList = await ShoppingListItem.find({ user: req.userId })
      .populate('ingredient')
      .populate('recipe');

    res.json(updatedList);
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