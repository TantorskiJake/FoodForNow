const express = require('express');
const authMiddleware = require('../middleware/auth');
const Recipe = require('../models/recipe');
const Ingredient = require('../models/ingredient');

const router = express.Router();

// Get all recipes for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const recipes = await Recipe.find({ createdBy: req.userId })
      .populate('ingredients.ingredient')
      .sort({ name: 1 });
    res.json(recipes);
  } catch (error) {
    console.error('Error getting recipes:', error);
    res.status(500).json({ error: 'Failed to get recipes' });
  }
});

// Get popular recipes
router.get('/popular', authMiddleware, async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('ingredients.ingredient')
      .sort({ popularity: -1 })
      .limit(5);
    res.json(recipes);
  } catch (error) {
    console.error('Error getting popular recipes:', error);
    res.status(500).json({ error: 'Failed to get popular recipes' });
  }
});

// Create new recipe
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      tags
    } = req.body;

    // Validate required fields
    if (!name || !description || !ingredients || !instructions || !prepTime || !cookTime || !servings) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify all ingredients exist and convert quantities to numbers
    const validatedIngredients = [];
    for (const ing of ingredients) {
      const ingredient = await Ingredient.findById(ing.ingredient);
      if (!ingredient) {
        return res.status(404).json({ error: `Ingredient ${ing.ingredient} not found` });
      }
      validatedIngredients.push({
        ingredient: ing.ingredient,
        quantity: Number(ing.quantity),
        unit: ing.unit
      });
    }

    const recipe = new Recipe({
      name,
      description,
      ingredients: validatedIngredients,
      instructions,
      prepTime: Number(prepTime),
      cookTime: Number(cookTime),
      servings: Number(servings),
      tags,
      createdBy: req.userId
    });

    await recipe.save();
    await recipe.populate('ingredients.ingredient');
    res.status(201).json(recipe);
  } catch (error) {
    console.error('Error creating recipe:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'A recipe with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create recipe' });
    }
  }
});

// Update recipe
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      ingredients,
      instructions,
      prepTime,
      cookTime,
      servings,
      tags
    } = req.body;

    // Verify recipe exists and belongs to user
    const existingRecipe = await Recipe.findOne({ _id: req.params.id, createdBy: req.userId });
    if (!existingRecipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Verify all ingredients exist and convert quantities to numbers if being updated
    let validatedIngredients;
    if (ingredients) {
      validatedIngredients = [];
      for (const ing of ingredients) {
        const ingredient = await Ingredient.findById(ing.ingredient);
        if (!ingredient) {
          return res.status(404).json({ error: `Ingredient ${ing.ingredient} not found` });
        }
        validatedIngredients.push({
          ingredient: ing.ingredient,
          quantity: Number(ing.quantity),
          unit: ing.unit
        });
      }
    }

    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(validatedIngredients && { ingredients: validatedIngredients }),
        ...(instructions && { instructions }),
        ...(prepTime && { prepTime: Number(prepTime) }),
        ...(cookTime && { cookTime: Number(cookTime) }),
        ...(servings && { servings: Number(servings) }),
        ...(tags && { tags })
      },
      { new: true }
    ).populate('ingredients.ingredient');

    res.json(recipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'A recipe with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update recipe' });
    }
  }
});

// Delete recipe
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// Get recipe by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('ingredients.ingredient');
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    console.error('Error getting recipe:', error);
    res.status(500).json({ error: 'Failed to get recipe' });
  }
});

module.exports = router; 