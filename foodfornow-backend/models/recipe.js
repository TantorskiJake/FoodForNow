const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  ingredients: [
    {
      ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true }, // Reference to Ingredient
      quantity: { type: Number, required: true }, // Quantity needed
      unit: { type: String, required: true } // Require unit to prevent errors
    }
  ],
  steps: [
    {
      stepNumber: { type: Number, required: true },
      instruction: { type: String, required: true }
    }
  ], // Improved step tracking
  healthScore: { type: Number, default: 50 }, // Optional health score
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true } // Faster queries by indexing
});

module.exports = mongoose.model("Recipe", RecipeSchema);