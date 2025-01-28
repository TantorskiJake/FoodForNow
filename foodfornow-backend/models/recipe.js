const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  ingredients: [
    {
      ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true }, // Reference to Ingredient
      quantity: { type: Number, required: true }, // Quantity needed
      unit: { type: String }, // Optional override for unit (defaults to Ingredient's defaultUnit)
    },
  ],
  steps: { type: [String], required: true }, // Step-by-step instructions
  healthScore: { type: Number, default: 50 }, // Optional health score
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User who created the recipe
});

module.exports = mongoose.model("Recipe", RecipeSchema);