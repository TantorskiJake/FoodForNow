const express = require("express");
const PantryItem = require("../models/pantry-item");
const Ingredient = require("../models/ingredient");
const authMiddleware = require("../middleware/auth");
const ShoppingListItem = require("../models/shopping-list-item");
const { inferIngredientCategory } = require("../services/recipeParserService");

const router = express.Router();

// Get pantry
router.get('/', authMiddleware, async (req, res) => {
  try {
    let items = await PantryItem.find({ user: req.userId })
      .populate('ingredient', 'name category');

    // Clean up any items with zero or negative quantity
    const toRemove = items.filter(item => !item.quantity || item.quantity <= 0);
    if (toRemove.length > 0) {
      await PantryItem.deleteMany({ _id: { $in: toRemove.map(i => i._id) } });
      items = await PantryItem.find({ user: req.userId })
        .populate('ingredient', 'name category');
    }

    const payload = items.map(item => ({
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
    res.json({ items: payload });
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

// Update item (PATCH /items/:itemId)
router.patch('/items/:itemId', authMiddleware, async (req, res) => {
  try {
    const { ingredient, ingredientName, ingredientCategory, ingredientDescription, quantity, unit, expiryDate } = req.body;
    const item = await PantryItem.findOne({ _id: req.params.itemId, user: req.userId });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    let resolvedIngredient;
    if (ingredient && ingredientName && String(ingredientName).trim()) {
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
    if (expiryDate !== undefined) item.expiryDate = expiryDate ? new Date(expiryDate) : null;
    await item.save();
    await item.populate('ingredient');
    res.json(item);
  } catch (error) {
    console.error('Error updating pantry item:', error);
    res.status(400).json({ error: 'Failed to update item' });
  }
});

// Add or update a pantry item
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { ingredient, ingredientName, ingredientCategory, ingredientDescription, quantity, unit, expiryDate } = req.body;
    if ((!ingredient && !ingredientName) || !quantity || !unit) {
      return res.status(400).json({ error: "Ingredient (or ingredient name), quantity, and unit are required" });
    }

    const validUnits = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'box'];
    if (!validUnits.includes(unit)) {
      return res.status(400).json({ error: `Invalid unit. Must be one of: ${validUnits.join(', ')}` });
    }

    const validIngredientId = await resolveIngredient(req, ingredient, ingredientName, ingredientCategory, ingredientDescription);
    if (!validIngredientId) {
      if (ingredient) {
        return res.status(400).json({ error: "Invalid ingredient ID" });
      }
      return res.status(400).json({ error: "Ingredient name is required" });
    }

    const updated = await PantryItem.findOneAndUpdate(
      { user: req.userId, ingredient: validIngredientId, unit },
      {
        $inc: { quantity: Number(quantity) },
        ...(expiryDate ? { $set: { expiryDate: new Date(expiryDate) } } : {})
      },
      { new: true, upsert: true }
    ).populate('ingredient', 'name category');

    const allItems = await PantryItem.find({ user: req.userId }).populate('ingredient', 'name category');
    const updatedPantry = { items: allItems };

    try {
      const AchievementService = require('../services/achievementService');
      const achievements = await AchievementService.checkPantryAchievements(req.userId, updatedPantry);
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

// Update item quantity (PUT /:id/quantity)
router.put('/:id/quantity', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await PantryItem.findOne({ _id: req.params.id, user: req.userId });
    if (!item) return res.status(404).json({ error: 'Pantry item not found' });

    const q = Number(quantity);
    if (q <= 0) {
      await PantryItem.findByIdAndDelete(item._id);
      const items = await PantryItem.find({ user: req.userId }).populate('ingredient', 'name category');
      return res.json({ items });
    }
    item.quantity = q;
    await item.save();
    const items = await PantryItem.find({ user: req.userId }).populate('ingredient', 'name category');
    res.json({ items });
  } catch (error) {
    console.error('Error updating item quantity:', error);
    res.status(400).json({ error: 'Failed to update item quantity' });
  }
});

// Delete item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await PantryItem.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!result) {
      return res.status(404).json({ error: 'Pantry item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Delete all pantry items for a user
router.delete("/", authMiddleware, async (req, res) => {
  try {
    await PantryItem.deleteMany({ user: req.userId });
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

    for (const item of shoppingItems) {
      if (!item.ingredient) continue;
      await PantryItem.findOneAndUpdate(
        { user: userId, ingredient: item.ingredient._id, unit: item.unit },
        { $inc: { quantity: item.quantity } },
        { new: true, upsert: true }
      );
    }

    await ShoppingListItem.deleteMany({ user: userId, completed: true });

    const User = require('../models/user');
    await User.findByIdAndUpdate(userId, { $inc: { completedShoppingListsCount: 1 } });

    const updatedItems = await PantryItem.find({ user: userId }).populate('ingredient', 'name category');
    const updatedPantry = { items: updatedItems };

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
