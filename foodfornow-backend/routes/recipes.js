const express = require("express");
const Recipe = require("../models/recipe");
const Ingredient = require("../models/ingred");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Get all recipes
router.get("/", async (req, res) => {
  try {
    const recipes = await Recipe.find().populate("ingredients.ingredient");
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// Add a new recipe
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, ingredients, steps, healthScore } = req.body;

    // Validate ingredients
    const ingredientIds = ingredients.map((i) => i.ingredient);
    const validIngredients = await Ingredient.find({ _id: { $in: ingredientIds } });

    if (validIngredients.length !== ingredientIds.length) {
      return res.status(400).json({ error: "One or more ingredients are invalid." });
    }

    const newRecipe = new Recipe({
      title,
      description,
      ingredients,
      steps,
      healthScore,
      createdBy: req.user.id,
    });

    await newRecipe.save();
    res.status(201).json(newRecipe);
  } catch (err) {
    res.status(400).json({ error: "Failed to add recipe" });
  }
});

// Delete all pantry items for a user
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const pantry = await Pantry.findOne({ user: req.user.id });

    if (!pantry) {
      return res.status(404).json({ error: "Pantry not found" });
    }

    pantry.items = []; // Clear all pantry items
    await pantry.save();

    res.json({ message: "Pantry cleared successfully" });
  } catch (err) {
    console.error("Error clearing pantry:", err.message);
    res.status(500).json({ error: "Failed to clear pantry" });
  }
});

module.exports = router;