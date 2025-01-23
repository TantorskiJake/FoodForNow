const express = require("express");
const Recipe = require("../models/recipe");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Get all recipes
router.get("/", async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// Add a new recipe
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, ingredients, steps, healthScore } = req.body;
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

module.exports = router;
