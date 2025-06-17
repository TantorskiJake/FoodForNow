const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Ingredient = require('../models/ingredient');
const Recipe = require('../models/recipe');

// Get all ingredients with search
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching ingredients for user:', req.userId);
    let { search = '' } = req.query;
    const filter = { user: req.userId };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    const ingredients = await Ingredient.find(filter).sort({ name: 1 });
    res.json(ingredients);
  } catch (err) {
    console.error('Error fetching ingredients:', err);
    res.status(500).json({ message: 'Error fetching ingredients' });
  }
});

// Get shared ingredients (those not created by the current user) with search,
// excluding any whose name matches the user's (case-insensitive)
router.get('/shared', authMiddleware, async (req, res) => {
  try {
    let { search = '' } = req.query;

    // Find all of the user's ingredient names (case-insensitive)
    const userIngredients = await Ingredient.find({ user: req.userId }).select('name');
    const userNames = userIngredients.map(i => i.name.toLowerCase());

    const filter = { user: { $ne: req.userId } };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    // Exclude ingredients whose name matches user's, case-insensitive
    if (userNames.length > 0) {
      filter.$expr = {
        $not: {
          $in: [{ $toLower: "$name" }, userNames]
        }
      };
    }

    const sharedIngredients = await Ingredient.find(filter).sort({ name: 1 });

    res.json(sharedIngredients);
  } catch (err) {
    console.error('Error fetching shared ingredients:', err);
    res.status(500).json({ message: 'Error fetching shared ingredients' });
  }
});

// Duplicate a shared ingredient into the current user's collection
router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    const original = await Ingredient.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    // Prevent duplicating if user already has this ingredient
    const existing = await Ingredient.findOne({ user: req.userId, name: original.name });
    if (existing) {
      return res.status(409).json({ message: 'You already have this ingredient in your collection' });
    }
    const duplicate = new Ingredient({
      name: original.name,
      category: original.category,
      defaultUnit: original.defaultUnit,
      description: original.description,
      notes: original.notes,
      user: req.userId
    });
    await duplicate.save();
    res.status(201).json(duplicate);
  } catch (err) {
    console.error('Error duplicating ingredient:', err);
    res.status(500).json({ message: 'Error duplicating ingredient' });
  }
});

// Add new ingredient
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Adding new ingredient:', { ...req.body, user: req.userId });
    const ingredient = new Ingredient({
      ...req.body,
      user: req.userId
    });
    await ingredient.save();
    res.status(201).json(ingredient);
  } catch (err) {
    console.error('Error adding ingredient:', err);
    res.status(500).json({ message: 'Error adding ingredient' });
  }
});

// Update ingredient
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Updating ingredient:', { id: req.params.id, ...req.body });
    const ingredient = await Ingredient.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    res.json(ingredient);
  } catch (err) {
    console.error('Error updating ingredient:', err);
    res.status(500).json({ message: 'Error updating ingredient' });
  }
});

// Delete ingredient
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('Deleting ingredient:', req.params.id);

    // Verify the ingredient exists and belongs to the user
    const ingredient = await Ingredient.findOne({
      _id: req.params.id,
      user: req.userId
    });
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    // Check if the ingredient is referenced by any of the user's recipes
    const inUse = await Recipe.findOne({
      createdBy: req.userId,
      'ingredients.ingredient': req.params.id
    });
    if (inUse) {
      return res.status(400).json({ message: 'Cannot delete ingredient: it is used in a recipe' });
    }

    await ingredient.deleteOne();
    res.json({ message: 'Ingredient deleted' });
  } catch (err) {
    console.error('Error deleting ingredient:', err);
    res.status(500).json({ message: 'Error deleting ingredient' });
  }
});

module.exports = router; 