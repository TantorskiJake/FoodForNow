const mongoose = require('mongoose');

/**
 * Shopping List Item Schema - Defines the structure for items in a user's shopping list
 * 
 * This model represents individual items that a user needs to purchase.
 * Items can be manually added or automatically generated from meal plans.
 * Each item tracks the ingredient, quantity needed, and completion status.
 */
const shoppingListItemSchema = new mongoose.Schema({
  // User who owns this shopping list item
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Reference to the ingredient that needs to be purchased
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  // Optional reference to the recipe that generated this shopping list item
  // Used for tracking which recipe requires this ingredient
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  },
  // Quantity of the ingredient needed
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
  // Whether the item has been purchased/completed
  completed: {
    type: Boolean,
    default: false
  }
}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true
});

// Create compound index for user and ingredient for efficient queries
// This allows quick lookups of shopping list items by user and ingredient
shoppingListItemSchema.index({ user: 1, ingredient: 1 });

// Compound index for "incomplete items" queries (common read pattern)
shoppingListItemSchema.index({ user: 1, completed: 1 });

// Create and export the ShoppingListItem model
const ShoppingListItem = mongoose.model('ShoppingListItem', shoppingListItemSchema);

module.exports = ShoppingListItem; 