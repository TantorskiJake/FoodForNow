const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Recipe name
  description: { type: String, required: true }, // Brief description
  ingredients: [{ type: mongoose.Schema.Types.ObjectId, ref: "Pantry", required: true }], // Ingredients used
  steps: { type: [String], required: true }, // Step-by-step instructions
  healthScore: { type: Number, default: 50 }, // Healthiness score (0–100)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User who created it
});

module.exports = mongoose.model("Recipe", RecipeSchema);
