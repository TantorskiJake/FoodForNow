const express = require("express");
const Ingredient = require("../models/ingred");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Create a new ingredient
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, defaultUnit, category } = req.body;

    // Validate required fields
    if (!name || !defaultUnit) {
      return res.status(400).json({ error: "Name and default unit are required" });
    }

    // Check if the ingredient already exists
    const existingIngredient = await Ingredient.findOne({ name });
    if (existingIngredient) {
      return res.status(400).json({ error: "Ingredient already exists" });
    }

    // Create and save the new ingredient
    const newIngredient = new Ingredient({ name, defaultUnit, category });
    await newIngredient.save();

    res.status(201).json(newIngredient);
  } catch (err) {
    console.error("Error creating ingredient:", err.message);
    res.status(500).json({ error: "Failed to create ingredient" });
  }
});

// Get all ingredients
router.get("/", async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.json(ingredients);
  } catch (err) {
    console.error("Error fetching ingredients:", err.message);
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
});

// Get a single ingredient by ID
router.get("/:id", async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);

    if (!ingredient) {
      return res.status(404).json({ error: "Ingredient not found" });
    }

    res.json(ingredient);
  } catch (err) {
    console.error("Error fetching ingredient:", err.message);
    res.status(500).json({ error: "Failed to fetch ingredient" });
  }
});

// Update an ingredient
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, defaultUnit, category } = req.body;

    // Find the ingredient and update it
    const updatedIngredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      { name, defaultUnit, category },
      { new: true, runValidators: true }
    );

    if (!updatedIngredient) {
      return res.status(404).json({ error: "Ingredient not found" });
    }

    res.json(updatedIngredient);
  } catch (err) {
    console.error("Error updating ingredient:", err.message);
    res.status(500).json({ error: "Failed to update ingredient" });
  }
});

// Delete an ingredient
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedIngredient = await Ingredient.findByIdAndDelete(req.params.id);

    if (!deletedIngredient) {
      return res.status(404).json({ error: "Ingredient not found" });
    }

    res.json({ message: "Ingredient deleted successfully" });
  } catch (err) {
    console.error("Error deleting ingredient:", err.message);
    res.status(500).json({ error: "Failed to delete ingredient" });
  }
});

module.exports = router;