const express = require("express");
const Pantry = require("../models/pantry");
const Ingredient = require("../models/ingredient");
const authMiddleware = require("../middleware/auth");
const mongoose = require("mongoose");
const ShoppingListItem = require("../models/shopping-list-item");
const { inferIngredientCategory } = require("../services/recipeParserService");

const router = express.Router();

// Get pantry
router.get('/', authMiddleware, async (req, res) => {
  try {
    const pantry = await Pantry.findOne({ user: req.userId })
      .populate('items.ingredient', 'name category');
    
    if (!pantry) {
      return res.json({ items: [] });
    }

    // Clean up any items with zero or negative quantity
    const originalCount = pantry.items.length;
    pantry.items = pantry.items.filter(item => item.quantity > 0);
    if (pantry.items.length !== originalCount) {
      await pantry.save();
    }

    // Ensure each item has the required fields and ingredient data
    const items = pantry.items.map(item => ({
      _id: item._id,
      ingredient: item.ingredient ? {
        _id: item.ingredient._id,
        name: item.ingredient.name,
        category: item.ingredient.category
      } : null,
      quantity: item.quantity,
      unit: item.unit,
      expiryDate: item.expiryDate
    }));
    res.json({ items });
  } catch (err) {
    console.error('Error fetching pantry:', err);
    res.status(500).json({ error: 'Failed to fetch pantry items' });
  }
});

const VALID_CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices', 'Beverages', 'Other'];

// Helper to resolve ingredient ID from either ID or name
async function resolveIngredient(req, ingredient, ingredientName, ingredientCategory, ingredientDescription) {
  if (ingredient) {
    const found = await Ingredient.findById(ingredient);
    if (found) return found._id;
    return null;
  }
  if (ingredientName && String(ingredientName).trim()) {
    const name = String(ingredientName).trim();
    let found = await Ingredient.findOne({
      user: req.userId,
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (!found) {
      const category = (ingredientCategory && VALID_CATEGORIES.includes(ingredientCategory))
        ? ingredientCategory
        : inferIngredientCategory(name);
      const description = ingredientDescription ? String(ingredientDescription).trim() : undefined;
      found = new Ingredient({ name, category, description, user: req.userId });
      await found.save();
    }
    return found._id;
  }
  return null;
}

// Update item
router.patch('/items/:itemId', authMiddleware, async (req, res) => {
  try {
    const { ingredient, ingredientName, ingredientCategory, ingredientDescription, quantity, unit, expiryDate } = req.body;
    const pantry = await Pantry.findOne({ user: req.userId });
    if (!pantry) {
      return res.status(404).json({ error: 'Pantry not found' });
    }
    const item = pantry.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    let resolvedIngredient;
    if (ingredient && ingredientName && String(ingredientName).trim()) {
      // Rename existing ingredient: update the ingredient's name
      const ing = await Ingredient.findOne({ _id: ingredient, user: req.userId });
      if (ing) {
        const newName = String(ingredientName).trim();
        const existingByName = await Ingredient.findOne({
          user: req.userId,
          _id: { $ne: ingredient },
          name: { $regex: new RegExp(`^${newName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        if (existingByName) {
          return res.status(400).json({ error: 'An ingredient with that name already exists' });
        }
        ing.name = newName;
        if (ingredientCategory && VALID_CATEGORIES.includes(ingredientCategory)) ing.category = ingredientCategory;
        if (ingredientDescription !== undefined) ing.description = String(ingredientDescription || '').trim();
        await ing.save();
        resolvedIngredient = ing._id;
      }
    }
    if (!resolvedIngredient) {
      resolvedIngredient = await resolveIngredient(req, ingredient, ingredientName, ingredientCategory, ingredientDescription);
    }
    if (resolvedIngredient) item.ingredient = resolvedIngredient;
    if (quantity !== undefined) item.quantity = Number(quantity);
    if (unit) item.unit = unit;
    if (expiryDate) item.expiryDate = new Date(expiryDate);
    await pantry.save();
    
    // Populate ingredient details before sending response
    await pantry.populate('items.ingredient');
    res.json(pantry);
  } catch (error) {
    console.error('Error updating pantry item:', error);
    res.status(400).json({ error: 'Failed to update item' });
  }
});

// Add or update a pantry item
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { ingredient, ingredientName, ingredientCategory, ingredientDescription, quantity, unit, expiryDate } = req.body;
    // Validate required fields - need either ingredient ID or ingredientName
    if ((!ingredient && !ingredientName) || !quantity || !unit) {
      return res.status(400).json({ error: "Ingredient (or ingredient name), quantity, and unit are required" });
    }

    // Validate unit
    const validUnits = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'box'];
    if (!validUnits.includes(unit)) {
      return res.status(400).json({ error: `Invalid unit. Must be one of: ${validUnits.join(', ')}` });
    }

    // Resolve ingredient: use ID if provided, otherwise find or create by name
    const validIngredientId = await resolveIngredient(req, ingredient, ingredientName, ingredientCategory, ingredientDescription);
    if (!validIngredientId) {
      if (ingredient) {
        return res.status(400).json({ error: "Invalid ingredient ID" });
      }
      return res.status(400).json({ error: "Ingredient name is required" });
    }
    const validIngredient = { _id: validIngredientId };

    // Find or create pantry
    let pantry = await Pantry.findOne({ user: req.userId });

    if (!pantry) {
      // Create new pantry with first item
      const newPantry = new Pantry({
        user: req.userId,
        items: [{
          ingredient: validIngredient._id,
          quantity: Number(quantity),
          unit: unit,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined
        }]
      });
      const savedPantry = await newPantry.save();
      return res.status(201).json(savedPantry);
    }

    // Clean up any items with old schema structure
    pantry.items = pantry.items.filter(item => item.ingredient);

    // Ensure items array exists
    if (!pantry.items) {
      pantry.items = [];
    }

    // Check if ingredient already exists with same unit
    const ingredientIdStr = validIngredient._id.toString();
    const existingItemIndex = pantry.items.findIndex(item => 
      item.ingredient && item.ingredient.toString() === ingredientIdStr && item.unit === unit
    );

    if (existingItemIndex > -1) {
      // Update existing item
      pantry.items[existingItemIndex].quantity += Number(quantity);
      if (expiryDate) {
        pantry.items[existingItemIndex].expiryDate = new Date(expiryDate);
      }
    } else {
      // Add new item
      pantry.items.push({
        ingredient: validIngredient._id,
        quantity: Number(quantity),
        unit: unit,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined
      });
    }
    const updatedPantry = await pantry.save();
    
    // Check for pantry-related achievements
    try {
      const AchievementService = require('../services/achievementService');
      const achievements = await AchievementService.checkPantryAchievements(req.userId, updatedPantry);
      
      // Add achievement data to response if any were unlocked
      if (achievements && achievements.length > 0) {
        const newlyCompleted = achievements.filter(a => a.newlyCompleted);
        if (newlyCompleted.length > 0) {
          res.status(201).json({
            pantry: updatedPantry,
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
    
    res.status(201).json(updatedPantry);
  } catch (err) {
    console.error("Error adding pantry item:", err);
    res.status(500).json({ error: "Failed to add pantry item" });
  }
});

// Update item quantity
router.put('/:id/quantity', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    const pantry = await Pantry.findOne({ user: req.userId });
    if (!pantry) return res.status(404).json({ error: 'Pantry not found' });
    
    const item = pantry.items.id(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    
    item.quantity = Number(quantity);
    
    if (item.quantity <= 0) {
      pantry.items = pantry.items.filter(i => i._id.toString() !== req.params.id);
    }
    
    await pantry.save();
    res.json(pantry);
  } catch (error) {
    console.error('Error updating item quantity:', error);
    res.status(400).json({ error: 'Failed to update item quantity' });
  }
});

// Delete item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pantry = await Pantry.findOne({ user: req.userId });
    if (!pantry) {
      return res.status(404).json({ error: 'Pantry not found' });
    }

    pantry.items = pantry.items.filter(item => item._id.toString() !== req.params.id);
    await pantry.save();

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Delete all pantry items for a user
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const pantry = await Pantry.findOne({ user: req.userId });

    if (!pantry) {
      return res.status(404).json({ error: "Pantry not found" });
    }

    // Clear all pantry items
    pantry.items = [];
    await pantry.save();

    res.json({ message: "Pantry cleared successfully" });
  } catch (err) {
    console.error("Error clearing pantry:", err.message);
    res.status(500).json({ error: "Failed to clear pantry" });
  }
});

// Add all shopping list items to pantry
router.post('/add-all-from-shopping-list', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const shoppingItems = await ShoppingListItem.find({ user: userId, completed: true })
      .populate('ingredient');
    if (!shoppingItems.length) {
      return res.status(200).json({ message: 'No completed items to add to pantry' });
    }

    // Get or create pantry
    let pantry = await Pantry.findOne({ user: userId });
    if (!pantry) {
      pantry = new Pantry({ user: userId, items: [] });
    }

    // Add each item to pantry
    for (const item of shoppingItems) {
      if (!item.ingredient) continue;

      // Check if ingredient already exists in pantry
      const existingItem = pantry.items.find(
        pItem => pItem.ingredient.toString() === item.ingredient._id.toString() && pItem.unit === item.unit
      );

      if (existingItem) {
        // Update quantity if item exists
        existingItem.quantity += item.quantity;
      } else {
        // Add new item to pantry
        pantry.items.push({
          ingredient: item.ingredient._id,
          quantity: item.quantity,
          unit: item.unit
        });
      }
    }

    await pantry.save();
    await ShoppingListItem.deleteMany({ user: userId, completed: true });

    // Increment completed shopping lists count (user "completed" their shopping by adding to pantry)
    const User = require('../models/user');
    await User.findByIdAndUpdate(userId, { $inc: { completedShoppingListsCount: 1 } });

    // Get updated pantry with populated ingredients
    const updatedPantry = await Pantry.findOne({ user: userId })
      .populate('items.ingredient');

    // Check for pantry and shopping list achievements
    try {
      const AchievementService = require('../services/achievementService');
      const pantryAchievements = await AchievementService.checkPantryAchievements(userId, updatedPantry);
      const shoppingAchievements = await AchievementService.checkShoppingListAchievements(userId, []);
      const allAchievements = [...(pantryAchievements || []), ...(shoppingAchievements || [])];

      if (allAchievements.length > 0) {
        const newlyCompleted = allAchievements.filter(a => a.newlyCompleted);
        if (newlyCompleted.length > 0) {
          return res.json({
            pantry: updatedPantry,
            achievements: newlyCompleted.map(a => ({
              name: a.config.name,
              description: a.config.description,
              icon: a.config.icon
            }))
          });
        }
      }
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
    }

    res.json(updatedPantry);
  } catch (error) {
    console.error('Error adding items to pantry:', error);
    res.status(500).json({ error: 'Failed to add items to pantry' });
  }
});

module.exports = router;