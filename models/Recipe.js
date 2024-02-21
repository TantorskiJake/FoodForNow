const mongoose = require('mongoose');

// Define the schema for the Recipe model
const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ingredients: { type: Array, required: true },
  instructions: { type: String, required: true },
  category: { type: String },
  prep_time: { type: Number },
  cook_time: { type: Number },
  servings: { type: Number },
  cuisine: { type: String },
  difficulty: { type: String },
  calories: { type: String },
  source: {
    name: { type: String },
    website: { type: String }
  },
  tags: { type: [String] },
  nutritional_info: {
    protein: { type: String },
    carbohydrates: { type: String },
    fat: { type: String },
    fiber: { type: String }
  },
  allergens: { type: [String] },
  equipment: { type: [String] },
  notes: { type: String },
  similar_recipes: [{
    title: { type: String },
    link: { type: String }
  }],
  keywords: { type: [String] },
  is_vegetarian: { type: Boolean },
  is_vegan: { type: Boolean },
  is_gluten_free: { type: Boolean },
  main_ingredient: { type: String },
  author: { type: String },
  created_at: { type: Date },
  updated_at: { type: Date }
});

// Define the Recipe model using the schema
const Recipe = mongoose.model('Recipe', recipeSchema, 'recipes');

module.exports = Recipe;