const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Pantry = require('../models/Pantry');

// Get all pantry items for the user
router.get('/', auth, async (req, res) => {
  try {
    const pantryItems = await Pantry.find({ user: req.user.id });
    res.json(pantryItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a new pantry item
router.post('/', auth, async (req, res) => {
  try {
    const { name, quantity, unit, expiryDate } = req.body;

    if (!name || !quantity || !unit || !expiryDate) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newItem = new Pantry({
      name,
      quantity,
      unit,
      expiryDate,
      user: req.user.id,
    });

    const item = await newItem.save();
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a pantry item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Pantry.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if the item belongs to the user
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    await item.remove();
    res.json({ message: 'Item removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 