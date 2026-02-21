const mongoose = require("mongoose");

/**
 * Pantry Item Schema - Defines the structure for individual items in a user's pantry
 *
 * Each document is one ingredient slot (user + ingredient + unit). Same ingredient
 * in different units are separate documents. Optimized for:
 * - Queries by user and ingredient
 * - Expiring-soon queries via (user, expiryDate)
 * - No single large document per user
 */
const pantryItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ingredient",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'box']
    },
    expiryDate: {
      type: Date
    }
  },
  { timestamps: true }
);

// Lookup by user + ingredient + unit (e.g. when adding: find existing to $inc)
pantryItemSchema.index({ user: 1, ingredient: 1, unit: 1 }, { unique: true });

// Expiring-soon and listing by user
pantryItemSchema.index({ user: 1, expiryDate: 1 });

module.exports = mongoose.model("PantryItem", pantryItemSchema);
