const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Ingredient = require('../models/ingredient');

// Get all ingredients with search and pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching ingredients for user:', req.userId);
    let { search = '', page = 1, limit = 10 } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const filter = { user: req.userId };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    const total = await Ingredient.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;
    const ingredients = await Ingredient.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ data: ingredients, total, page, totalPages });
  } catch (err) {
    console.error('Error fetching ingredients:', err);
    res.status(500).json({ message: 'Error fetching ingredients' });
  }
});

// Get shared ingredients (those not created by the current user) with search and pagination,
// excluding any whose name matches the user's (case-insensitive)
router.get('/shared', authMiddleware, async (req, res) => {
  try {
    let { search = '', page = 1, limit = 10 } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

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

    const total = await Ingredient.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;
    const sharedIngredients = await Ingredient.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ data: sharedIngredients, total, page, totalPages });
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
    const ingredient = await Ingredient.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    res.json({ message: 'Ingredient deleted' });
  } catch (err) {
    console.error('Error deleting ingredient:', err);
    res.status(500).json({ message: 'Error deleting ingredient' });
  }
});

module.exports = router; 