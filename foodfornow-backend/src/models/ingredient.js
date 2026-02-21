const mongoose = require('mongoose');
const { normalizeIngredientName } = require('../utils/ingredientNormalization');

/** Capitalize first letter of each word for consistent display and sorting */
function capitalizeWords(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

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
  normalizedName: {
    type: String,
    required: true,
    trim: true,
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

// Normalize name to title case (first letter of each word capitalized) before validation
ingredientSchema.pre('validate', function (next) {
  if (this.name && this.isModified('name')) {
    this.name = capitalizeWords(this.name);
  }
  if (this.name && (this.isModified('name') || !this.normalizedName)) {
    this.normalizedName = normalizeIngredientName(this.name);
  }
  next();
});

ingredientSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (!update) return next();

  const ensureNormalizedName = (value) => {
    if (!value) return;
    if (!update.$set) update.$set = {};
    update.$set.normalizedName = normalizeIngredientName(value);
  };

  if (update.name) {
    update.name = capitalizeWords(update.name);
    ensureNormalizedName(update.name);
  }
  if (update.$set && update.$set.name) {
    update.$set.name = capitalizeWords(update.$set.name);
    ensureNormalizedName(update.$set.name);
  }

  next();
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

// Secondary index for normalized lookups to avoid O(n) scans
ingredientSchema.index({ user: 1, normalizedName: 1 });

// Create and export the Ingredient model
const Ingredient = mongoose.model('Ingredient', ingredientSchema);

module.exports = Ingredient; 
