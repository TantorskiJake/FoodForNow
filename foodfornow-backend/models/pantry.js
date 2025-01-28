const mongoose = require("mongoose");

const PantrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }, // Each user has one pantry
  items: [
    {
      ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true }, // Reference to Ingredient
      quantity: { type: Number, required: true }, // Current quantity available
      unit: { type: String, required: true }, // Unit for this ingredient
    },
  ],
});

module.exports = mongoose.model("Pantry", PantrySchema);