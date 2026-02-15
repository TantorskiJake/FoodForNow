const express = require('express');
const authMiddleware = require('../middleware/auth');
const Recipe = require('../models/recipe');
const Ingredient = require('../models/ingredient');
const { parseRecipeFromUrl, buildRawRecipeFormat, transformToRecipeFormat } = require('../services/recipeParserService');

const router = express.Router();

const VALID_UNITS = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch'];

// Get all recipes for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = { createdBy: req.userId };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const recipes = await Recipe.find(query)
      .populate('ingredients.ingredient', 'name category')
      .sort({ createdAt: -1 });
    
    res.json(recipes);
  } catch (err) {
    console.error('Error fetching recipes:', err);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});


// Parse recipe from URL - returns recipe data with suggested categories (no ingredient creation)
// Frontend may show a category review step for uncertain ingredients before calling prepare-import
router.post('/parse-url', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return res.status(400).json({ error: 'Please provide a valid URL starting with http:// or https://' });
    }

    const parsed = await parseRecipeFromUrl(trimmed);
    const recipeData = buildRawRecipeFormat(parsed, VALID_UNITS);
    res.json(recipeData);
  } catch (err) {
    console.error('Error parsing recipe URL:', err);
    const message = err.message || 'Failed to parse recipe from URL. The site may not be supported.';
    res.status(400).json({ error: message });
  }
});

// Create ingredients from parsed recipe data with user-selected categories
// Call after parse-url; use categoryOverrides for ingredients where uncertain was true
router.post('/prepare-import', authMiddleware, async (req, res) => {
  try {
    const { recipeData, categoryOverrides = {} } = req.body;
    if (!recipeData || !recipeData.name || !Array.isArray(recipeData.ingredients)) {
      return res.status(400).json({ error: 'Invalid recipe data' });
    }

    const result = await transformToRecipeFormat(
      recipeData,
      req.userId,
      Ingredient,
      VALID_UNITS,
      categoryOverrides
    );
    res.json(result);
  } catch (err) {
    console.error('Error preparing recipe import:', err);
    res.status(400).json({ error: err.message || 'Failed to prepare recipe import' });
  }
});

// Get popular recipes (current user's recipes, sorted by popularity)
router.get('/popular', authMiddleware, async (req, res) => {
  try {
    const recipes = await Recipe.find({ createdBy: req.userId })
      .populate('ingredients.ingredient')
      .sort({ popularity: -1 })
      .limit(5);
    res.json(recipes);
  } catch (error) {
    console.error('Error getting popular recipes:', error);
    res.status(500).json({ error: 'Failed to get popular recipes' });
  }
});

// Get shared recipes (those not created by the current user) with optional search,
// excluding recipes with a name the user already has (case-insensitive)
router.get('/shared', authMiddleware, async (req, res) => {
  try {
    const { search = '' } = req.query;
    // Fetch user recipe names
    const userRecipes = await Recipe.find({ createdBy: req.userId }).select('name');
    const userNames = userRecipes.map(r => r.name.toLowerCase());

    // Build filter for other users' recipes
    const filter = { createdBy: { $ne: req.userId } };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (userNames.length) {
      filter.$expr = {
        $not: { $in: [{ $toLower: "$name" }, userNames] }
      };
    }

    const recipes = await Recipe.find(filter)
      .populate('ingredients.ingredient')
      .sort({ name: 1 });

    // Deduplicate by recipe name (case-insensitive)
    const deduped = [];
    const seen = new Set();
    for (const recipe of recipes) {
      const key = recipe.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(recipe);
      }
    }

    res.json(deduped);
  } catch (err) {
    console.error('Error fetching shared recipes:', err);
    res.status(500).json({ error: 'Failed to fetch shared recipes' });
  }
});

// Duplicate a shared recipe into the current user's collection
router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    const original = await Recipe.findById(req.params.id).populate('ingredients.ingredient');
    if (!original) return res.status(404).json({ error: 'Recipe not found' });

    // Prevent duplicating if user already has recipe by name
    const exists = await Recipe.findOne({ createdBy: req.userId, name: original.name });
    if (exists) return res.status(409).json({ error: 'Recipe already in your collection' });

    // For each ingredient, ensure user has it or duplicate it
    const newIngredients = [];
    for (const ing of original.ingredients) {
      const origIng = ing.ingredient;
      // Case-insensitive search by name
      let userIng = await Ingredient.findOne({
        user: req.userId,
        name: origIng.name
      }).collation({ locale: 'en', strength: 2 });
      if (!userIng) {
        userIng = new Ingredient({
          name: origIng.name,
          category: origIng.category,
          description: origIng.description,
          user: req.userId
        });
        await userIng.save();
      }
      newIngredients.push({
        ingredient: userIng._id,
        quantity: ing.quantity,
        unit: ing.unit
      });
    }

    // Create duplicated recipe
    const duplicate = new Recipe({
      name: original.name,
      description: original.description,
      ingredients: newIngredients,
      instructions: original.instructions,
      prepTime: original.prepTime,
      cookTime: original.cookTime,
      servings: original.servings,
      tags: original.tags,
      createdBy: req.userId
    });
    await duplicate.save();
    await duplicate.populate('ingredients.ingredient');
    res.status(201).json(duplicate);
  } catch (err) {
    console.error('Error duplicating recipe:', err);
    res.status(500).json({ error: 'Failed to duplicate recipe' });
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
    
    // Check for recipe-related achievements
    try {
      const AchievementService = require('../services/achievementService');
      const achievements = await AchievementService.checkRecipeAchievements(req.userId, recipe);
      
      // Add achievement data to response if any were unlocked
      if (achievements && achievements.length > 0) {
        const newlyCompleted = achievements.filter(a => a.newlyCompleted);
        if (newlyCompleted.length > 0) {
          res.status(201).json({
            recipe,
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
    // Only allow access to recipes owned by the authenticated user
    const recipe = await Recipe.findOne({
      _id: req.params.id,
      createdBy: req.userId
    }).populate('ingredients.ingredient');

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
