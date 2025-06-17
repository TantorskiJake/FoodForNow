const mongoose = require('mongoose');

const ingredientChangeRequestSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true,
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  proposedChanges: {
    type: Object,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('IngredientChangeRequest', ingredientChangeRequestSchema);
