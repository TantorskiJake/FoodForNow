const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Ingredient = require('../models/ingredient');

// Get all ingredients
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching ingredients for user:', req.userId);
    const ingredients = await Ingredient.find({ user: req.userId }).sort({ name: 1 });
    res.json(ingredients);
  } catch (err) {
    console.error('Error fetching ingredients:', err);
    res.status(500).json({ message: 'Error fetching ingredients' });
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