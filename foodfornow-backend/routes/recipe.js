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

// Update an existing recipe
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description, ingredients, steps, healthScore } = req.body;

    // Validate that the recipe exists
    let recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    // Validate ingredients if provided
    if (ingredients) {
      const ingredientIds = ingredients.map((i) => i.ingredient);
      const validIngredients = await Ingredient.find({ _id: { $in: ingredientIds } });

      if (validIngredients.length !== ingredientIds.length) {
        return res.status(400).json({ error: "One or more ingredients are invalid." });
      }
    }

    // Update fields only if they are provided
    if (title) recipe.title = title;
    if (description) recipe.description = description;
    if (ingredients) recipe.ingredients = ingredients;
    if (steps) recipe.steps = steps;
    if (healthScore !== undefined) recipe.healthScore = healthScore;

    await recipe.save();
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

// Delete a recipe by ID
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    await Recipe.findByIdAndDelete(req.params.id);
    res.json({ message: "Recipe deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

module.exports = router;