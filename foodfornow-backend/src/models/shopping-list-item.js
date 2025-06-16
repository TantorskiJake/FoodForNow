const mongoose = require('mongoose');

const shoppingListItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch']
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create compound index for user and ingredient
shoppingListItemSchema.index({ user: 1, ingredient: 1 });

const ShoppingListItem = mongoose.model('ShoppingListItem', shoppingListItemSchema);

module.exports = ShoppingListItem; 