const mongoose = require("mongoose");

const IngredientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Ingredient name (unique for consistency)
  defaultUnit: { type: String, required: true }, // Default unit (e.g., "kg", "g")
  category: { type: String }, // Optional category (e.g., "Vegetables")
});

module.exports = mongoose.model("Ingredient", IngredientSchema);