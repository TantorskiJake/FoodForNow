const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ingredients: [
    {
      quantity: { type: mongoose.Schema.Types.Mixed, required: true },
      quantity_type: { type: String, required: true },
      type: { type: String, required: true }
    }
  ],
  instructions: { type: String, required: true },
  category: { type: String, required: true },
  prep_time: { type: Number, required: true },
  cook_time: { type: Number, required: true },
  servings: { type: Number, required: true },
  cuisine: { type: String, required: true },
  difficulty: { type: String, required: true },
  calories: String,
  source: {
    name: String,
    website: String
  },
  tags: [String],
  nutritional_info: {
    protein: String,
    carbohydrates: String,
    fat: String,
    fiber: String
  },
  allergens: [String],
  equipment: [String],
  notes: String,
  similar_recipes: [
    {
      title: String,
      link: String
    }
  ],
  keywords: [String],
  is_vegetarian: Boolean,
  is_vegan: Boolean,
  is_gluten_free: Boolean,
  main_ingredient: String,
  author: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
