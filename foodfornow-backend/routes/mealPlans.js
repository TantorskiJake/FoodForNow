const express = require("express");
const mongoose = require("mongoose");
const MealPlan = require("../models/mealPlan");
const Recipe = require("../models/recipe");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Get all meal plans for the user
router.get("/", authMiddleware, async (req, res) => {
  console.log("🔍 User attempting to access meal plans:", req.user);

  try {
    const mealPlans = await MealPlan.find({ user: req.user.id }).populate("meals.recipe");
    res.json(mealPlans);
  } catch (err) {
    console.error("❌ Error fetching meal plans:", err);
    res.status(500).json({ error: "Failed to fetch meal plans" });
  }
});

// Get a single meal plan by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({ _id: req.params.id, user: req.user.id }).populate("meals.recipe");

    if (!mealPlan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    res.json(mealPlan);
  } catch (err) {
    console.error("Error fetching meal plan:", err);
    res.status(500).json({ error: "Failed to fetch meal plan" });
  }
});

// Create a meal plan (Prevent duplicate weeks)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { week, meals } = req.body;

    // Check if a meal plan for this week already exists
    const existingMealPlan = await MealPlan.findOne({ user: req.user.id, week });
    if (existingMealPlan) {
      return res.status(400).json({ error: "A meal plan for this week already exists." });
    }

    // Convert recipe IDs safely
    const recipeIds = meals.map((meal) => mongoose.isValidObjectId(meal.recipe) ? new mongoose.Types.ObjectId(meal.recipe) : null);
    if (recipeIds.includes(null)) {
      return res.status(400).json({ error: "One or more recipe IDs are invalid." });
    }

    console.log("Recipe IDs from request:", recipeIds);

    // Validate recipe references
    const validRecipes = await Recipe.find({ _id: { $in: recipeIds } });
    console.log("Valid recipes from database:", validRecipes);

    // Identify invalid recipe IDs
    const validRecipeIds = validRecipes.map((recipe) => recipe._id.toString());
    const invalidRecipes = recipeIds.filter((id) => !validRecipeIds.includes(id.toString()));

    if (invalidRecipes.length > 0) {
      return res.status(400).json({ 
        error: "One or more recipes are invalid.", 
        invalidRecipes 
      });
    }

    // Validate days
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const invalidDays = meals.filter((meal) => !validDays.includes(meal.day)).map((meal) => meal.day);
    if (invalidDays.length > 0) {
      return res.status(400).json({ error: `Invalid day(s): ${invalidDays.join(", ")}` });
    }

    const newMealPlan = new MealPlan({
      user: req.user.id,
      week,
      meals,
    });

    await newMealPlan.save();
    res.status(201).json(newMealPlan);
  } catch (err) {
    console.error("Error creating meal plan:", err);
    res.status(400).json({ error: "Failed to create meal plan" });
  }
});

// Update an existing meal plan
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { week, meals } = req.body;

    let mealPlan = await MealPlan.findOne({ _id: req.params.id, user: req.user.id });

    if (!mealPlan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    // Validate recipe references if updating meals
    if (meals) {
      const recipeIds = meals.map((meal) => mongoose.Types.ObjectId(meal.recipe));
      const validRecipes = await Recipe.find({ _id: { $in: recipeIds } });

      console.log("Recipe IDs from request:", recipeIds);
      console.log("Valid recipes from database:", validRecipes);

      const validRecipeIds = validRecipes.map((recipe) => recipe._id.toString());
      const invalidRecipes = recipeIds.filter((id) => !validRecipeIds.includes(id.toString()));

      if (invalidRecipes.length > 0) {
        return res.status(400).json({ 
          error: "One or more recipes are invalid.", 
          invalidRecipes 
        });
      }
    }

    // Validate days
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const invalidDays = meals.filter((meal) => !validDays.includes(meal.day)).map((meal) => meal.day);
    if (invalidDays.length > 0) {
      return res.status(400).json({ error: `Invalid day(s): ${invalidDays.join(", ")}` });
    }

    // Update fields
    if (week) mealPlan.week = week;
    if (meals) mealPlan.meals = meals;

    await mealPlan.save();
    res.json(mealPlan);
  } catch (err) {
    console.error("Error updating meal plan:", err);
    res.status(500).json({ error: "Failed to update meal plan" });
  }
});

// Delete a meal plan by ID
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const mealPlan = await MealPlan.findOne({ _id: req.params.id, user: req.user.id });

    if (!mealPlan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    await MealPlan.findByIdAndDelete(req.params.id);
    res.json({ message: "Meal plan deleted successfully" });
  } catch (err) {
    console.error("Error deleting meal plan:", err);
    res.status(500).json({ error: "Failed to delete meal plan" });
  }
});

module.exports = router;