const express = require("express");
const Pantry = require("../models/pantry");
const Ingredient = require("../models/ingred");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Get all pantry items for a user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const pantry = await Pantry.findOne({ user: req.user.id }).populate("items.ingredient");

    if (!pantry || pantry.items.length === 0) {
      return res.json([]); // Return an empty array if pantry is empty
    }

    res.json(pantry.items);
  } catch (err) {
    console.error("Error fetching pantry items:", err.message);
    res.status(500).json({ error: "Failed to fetch pantry items" });
  }
});

// Add or update a pantry item
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { ingredient, quantity, unit } = req.body;

    console.log("Pantry Item Add Request:", { ingredient, quantity, unit });

    // Validate ingredient is a valid ObjectId
    if (!ingredient || !quantity || !unit) {
      return res.status(400).json({ error: "Ingredient, quantity, and unit are required" });
    }

    const validIngredient = await Ingredient.findById(ingredient);
    if (!validIngredient) {
      console.error("Invalid ingredient ID:", ingredient);
      return res.status(400).json({ error: "Invalid ingredient ID" });
    }

    let pantry = await Pantry.findOne({ user: req.user.id });

    if (!pantry) {
      pantry = new Pantry({
        user: req.user.id,
        items: [{ ingredient, quantity, unit }],
      });
      await pantry.save();
      console.log("New Pantry Created:", pantry);
      return res.status(201).json(pantry);
    }

    // Check if the ingredient already exists in the pantry with the same unit
    const itemIndex = pantry.items.findIndex(
      (item) => item.ingredient.toString() === ingredient && item.unit === unit
    );

    if (itemIndex > -1) {
      pantry.items[itemIndex].quantity += quantity; // Update existing item quantity
    } else {
      pantry.items.push({ ingredient, quantity, unit }); // Add new item
    }

    const updatedPantry = await pantry.save();
    console.log("Updated Pantry:", updatedPantry);
    res.status(201).json(updatedPantry);
  } catch (err) {
    console.error("Error adding pantry item:", err.message);
    res.status(500).json({ error: "Failed to add pantry item" });
  }
});

// Delete a single pantry item
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const pantry = await Pantry.findOne({ user: req.user.id });

    if (!pantry) {
      return res.status(404).json({ error: "Pantry not found" });
    }

    const itemIndex = pantry.items.findIndex((item) => item._id.toString() === req.params.id);
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in pantry" });
    }

    pantry.items.splice(itemIndex, 1); // Remove the item
    await pantry.save();

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("Error deleting pantry item:", err.message);
    res.status(500).json({ error: "Failed to delete pantry item" });
  }
});

// Delete all pantry items for a user
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const pantry = await Pantry.findOne({ user: req.user.id });

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

module.exports = router;