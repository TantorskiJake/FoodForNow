const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ShoppingList = require('../models/ShoppingList');
const Pantry = require('../models/Pantry');

// Debug middleware for this route
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ShoppingList Route - ${req.method} ${req.url}`);
  next();
});

// Get all shopping list items for the user
router.get('/', auth, async (req, res) => {
  try {
    console.log('GET /shopping-list - User ID:', req.user.id);
    
    const shoppingItems = await ShoppingList.find({ 
      user: req.user.id,
      addedToPantry: false 
    }).populate('recipe');
    
    console.log('Found shopping items:', shoppingItems);
    
    // Always return an array, even if empty
    res.json(shoppingItems || []);
  } catch (err) {
    console.error('Error in GET /shopping-list:', err);
    res.status(500).json({ error: 'Failed to fetch shopping list' });
  }
});

// Add all shopping list items to pantry
router.post('/add-to-pantry', auth, async (req, res) => {
  try {
    console.log('POST /shopping-list/add-to-pantry - User ID:', req.user.id);
    
    const shoppingItems = await ShoppingList.find({ 
      user: req.user.id,
      addedToPantry: false 
    });

    console.log('Found items to add to pantry:', shoppingItems);

    if (!shoppingItems || shoppingItems.length === 0) {
      console.log('No items to add to pantry');
      return res.json({ message: 'No items to add to pantry' });
    }

    for (const item of shoppingItems) {
      // Check if item already exists in pantry
      const existingItem = await Pantry.findOne({
        user: req.user.id,
        name: item.name,
        unit: item.unit,
      });

      if (existingItem) {
        // Update quantity if item exists
        existingItem.quantity += item.quantity;
        await existingItem.save();
        console.log('Updated existing pantry item:', existingItem.name);
      } else {
        // Create new pantry item
        const newPantryItem = new Pantry({
          user: req.user.id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        });
        await newPantryItem.save();
        console.log('Created new pantry item:', newPantryItem.name);
      }

      // Mark shopping list item as added to pantry
      item.addedToPantry = true;
      await item.save();
      console.log('Marked shopping list item as added to pantry:', item.name);
    }

    res.json({ message: 'All items added to pantry' });
  } catch (err) {
    console.error('Error in POST /shopping-list/add-to-pantry:', err);
    res.status(500).json({ error: 'Failed to add items to pantry' });
  }
});

// Delete a shopping list item
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('DELETE /shopping-list/:id - User ID:', req.user.id, 'Item ID:', req.params.id);
    
    const item = await ShoppingList.findById(req.params.id);

    if (!item) {
      console.log('Item not found:', req.params.id);
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if the item belongs to the user
    if (item.user.toString() !== req.user.id) {
      console.log('Unauthorized access attempt - User ID:', req.user.id, 'Item User ID:', item.user);
      return res.status(401).json({ error: 'Not authorized' });
    }

    await item.deleteOne();
    console.log('Deleted shopping list item:', item.name);
    res.json({ message: 'Item removed' });
  } catch (err) {
    console.error('Error in DELETE /shopping-list/:id:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router; 