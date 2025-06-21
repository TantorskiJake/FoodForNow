const mongoose = require('mongoose');

/**
 * Ingredient Schema - Defines the structure for ingredients in the application
 * 
 * This model stores ingredient information used in recipes and pantry management.
 * Each ingredient belongs to a user and has a category for organization.
 */
const ingredientSchema = new mongoose.Schema({
  // Ingredient name - displayed in UI and used for search
  name: {
    type: String,
    required: true,
    trim: true // Remove leading/trailing whitespace
  },
  // Category for organizing ingredients (e.g., Produce, Dairy, Meat)
  category: {
    type: String,
    required: true,
    enum: ['Produce', 'Dairy', 'Meat', 'Seafood', 'Pantry', 'Spices', 'Beverages', 'Other']
  },
  // Optional description providing additional context
  description: {
    type: String,
    trim: true
  },
  // User who created this ingredient
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true
});

// Create a compound index for user and name to ensure unique ingredients per user
// This prevents duplicate ingredient names within a user's collection
ingredientSchema.index(
  { user: 1, name: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 }, // Case-insensitive comparison
  }
);

// Create and export the Ingredient model
const Ingredient = mongoose.model('Ingredient', ingredientSchema);

module.exports = Ingredient; 