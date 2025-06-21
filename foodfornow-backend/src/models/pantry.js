const mongoose = require("mongoose");

const pantryItemSchema = new mongoose.Schema({
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
    enum: ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch']
  },
  expiryDate: {
    type: Date
  }
});

const pantrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: [pantryItemSchema]
}, {
  timestamps: true
});

// Remove the unique index that was causing issues
// pantrySchema.index({ user: 1, "items.ingredient": 1 }, { unique: true });

module.exports = mongoose.model("Pantry", pantrySchema);