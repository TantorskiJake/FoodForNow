const express = require("express");
const MealPlan = require("../models/mealPlan");
const Recipe = require("../models/recipe");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Get meal plans for the user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const mealPlans = await MealPlan.find({ user: req.user.id }).populate("meals.recipe");
    res.json(mealPlans);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch meal plans" });
  }
});

// Create a meal plan
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { week, meals } = req.body;

    // Validate recipe references
    const recipeIds = meals.map((meal) => meal.recipe);
    const validRecipes = await Recipe.find({ _id: { $in: recipeIds } });

    if (validRecipes.length !== recipeIds.length) {
      return res.status(400).json({ error: "One or more recipes are invalid." });
    }

    const newMealPlan = new MealPlan({
      user: req.user.id,
      week,
      meals,
    });
    await newMealPlan.save();
    res.status(201).json(newMealPlan);
  } catch (err) {
    res.status(400).json({ error: "Failed to create meal plan" });
  }
});

module.exports = router;