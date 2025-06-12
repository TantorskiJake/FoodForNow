const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MealPlan = require('../models/MealPlan');
const Recipe = require('../models/Recipe');
const Pantry = require('../models/Pantry');
const ShoppingList = require('../models/ShoppingList');

// Get all meal plans for the user
router.get('/', auth, async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({ user: req.user.id })
      .populate('recipe')
      .sort({ weekStart: 1, day: 1 });
    res.json(mealPlans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a new meal to the plan
router.post('/', auth, async (req, res) => {
  try {
    const { weekStart, day, meal, recipeId } = req.body;

    if (!weekStart || !day || !meal || !recipeId) {
      return res.status(400).json({ error: 'Week start, day, meal, and recipe are required' });
    }

    // Check if a meal already exists for this day and time
    const existingMeal = await MealPlan.findOne({
      user: req.user.id,
      weekStart,
      day,
      meal,
    });

    if (existingMeal) {
      return res.status(400).json({ error: 'A meal already exists for this day and time' });
    }

    // Get the recipe
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Create the meal plan entry
    const newMeal = new MealPlan({
      weekStart,
      day,
      meal,
      recipe: recipeId,
      user: req.user.id,
    });

    const savedMeal = await newMeal.save();

    // Check ingredients against pantry and add to shopping list if needed
    for (const ingredient of recipe.ingredients) {
      // Check if ingredient exists in pantry
      const pantryItem = await Pantry.findOne({
        user: req.user.id,
        name: ingredient.name,
        used: false,
      });

      if (pantryItem) {
        // If we have enough in pantry, mark it as used
        if (pantryItem.quantity >= ingredient.quantity) {
          pantryItem.used = true;
          pantryItem.mealPlan = savedMeal._id;
          await pantryItem.save();
        } else {
          // If we don't have enough, add the difference to shopping list
          const remainingQuantity = ingredient.quantity - pantryItem.quantity;
          pantryItem.used = true;
          pantryItem.mealPlan = savedMeal._id;
          await pantryItem.save();

          const shoppingItem = new ShoppingList({
            user: req.user.id,
            name: ingredient.name,
            quantity: remainingQuantity,
            unit: ingredient.unit,
            recipe: recipeId,
            mealPlan: savedMeal._id,
          });
          await shoppingItem.save();
        }
      } else {
        // If not in pantry, add to shopping list
        const shoppingItem = new ShoppingList({
          user: req.user.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          recipe: recipeId,
          mealPlan: savedMeal._id,
        });
        await shoppingItem.save();
      }
    }

    res.json(savedMeal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a meal from the plan
router.delete('/:id', auth, async (req, res) => {
  try {
    const meal = await MealPlan.findById(req.params.id);

    if (!meal) {
      return res.status(404).json({ error: 'Meal plan item not found' });
    }

    // Check if the meal belongs to the user
    if (meal.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    // Mark pantry items as unused
    await Pantry.updateMany(
      { mealPlan: meal._id },
      { $set: { used: false, mealPlan: null } }
    );

    // Remove shopping list items
    await ShoppingList.deleteMany({ mealPlan: meal._id });

    await meal.remove();
    res.json({ message: 'Meal removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 