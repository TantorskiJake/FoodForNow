const mongoose = require("mongoose");

/**
 * Pantry Item Schema - Defines the structure for individual items in a user's pantry
 * 
 * This sub-schema represents a single ingredient with its quantity, unit, and expiry date.
 * It's embedded within the main Pantry schema.
 */
const pantryItemSchema = new mongoose.Schema({
  // Reference to the ingredient document
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
    required: true
  },
  // Current quantity of the ingredient in the pantry
  quantity: {
    type: Number,
    required: true,
    min: 0 // Cannot have negative quantities
  },
  // Unit of measurement for the quantity
  unit: {
    type: String,
    required: true,
    enum: ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'box']
  },
  // Optional expiry date for perishable items
  expiryDate: {
    type: Date
  }
});

/**
 * Pantry Schema (LEGACY) - One doc per user with embedded items[].
 * Application code uses the PantryItem collection (see pantry-item.js).
 * This model is kept only for migration (migrate-pantry-to-pantry-item.js)
 * and cleanup-db.js to clear old data.
 */
const pantrySchema = new mongoose.Schema({
  // User who owns this pantry
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Array of pantry items (ingredients with quantities)
  items: [pantryItemSchema]
}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true
});

// Note: Removed unique index that was causing issues with pantry item management
// pantrySchema.index({ user: 1, "items.ingredient": 1 }, { unique: true });

// Export the Pantry model
module.exports = mongoose.model("Pantry", pantrySchema);