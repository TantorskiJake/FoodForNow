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

module.exports = router; 