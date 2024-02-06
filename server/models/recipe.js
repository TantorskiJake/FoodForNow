// models/recipe.js

const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  // ... (unchanged content) title: { type: String, required: true },
  ingredients: { type: [String], required: true },
  instructions: { type: String, required: true },
  category: { type: String, required: true },
  prepTime: { type: Number, required: true },
  cookTime: { type: Number, required: true },
  servings: { type: Number, required: true },
  cuisine: { type: String, required: true },
  difficulty: { type: String, required: true },
  calories: { type: String },
  source: {
    name: { type: String },
    website: { type: String },
  },
  tags: { type: [String] },
  nutritionalInfo: {
    protein: { type: String },
    carbohydrates: { type: String },
    fat: { type: String },
    fiber: { type: String },
  },
  allergens: { type: [String] },
  equipment: { type: [String] },
  notes: { type: String },
  similarRecipes: [
    {
      title: { type: String },
      link: { type: String },
    },
  ],
  keywords: { type: [String] },
  isVegetarian: { type: Boolean, default: false },
  isVegan: { type: Boolean, default: false },
  isGlutenFree: { type: Boolean, default: false },
  mainIngredient: { type: String },
  author: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Recipe = mongoose.model('Recipe', recipeSchema); // Specify the collection name
module.exports = Recipe;

