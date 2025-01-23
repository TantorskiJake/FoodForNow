const mongoose = require("mongoose");

const PantrySchema = new mongoose.Schema({
  name: { type: String, required: true }, // Ingredient name
  quantity: { type: Number, required: true }, // How much of the ingredient
  unit: { type: String, required: true }, // Measurement unit (e.g., "kg", "liters")
  expirationDate: { type: Date }, // Optional expiration date
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Associated user
});

module.exports = mongoose.model("Pantry", PantrySchema);
