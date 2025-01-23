const mongoose = require("mongoose");

const MealPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Associated user
  week: { type: String, required: true }, // Format: YYYY-WW (e.g., "2025-03" for Week 3 of 2025)
  meals: [
    {
      day: { type: String, required: true }, // Day of the week (e.g., "Monday")
      recipe: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true }, // Linked recipe
    },
  ],
});

module.exports = mongoose.model("MealPlan", MealPlanSchema);
