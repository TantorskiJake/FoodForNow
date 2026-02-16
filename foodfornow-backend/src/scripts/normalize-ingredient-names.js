require('dotenv').config();
const mongoose = require('mongoose');
const Ingredient = require('../models/ingredient');

/**
 * Normalize all ingredient names to title case (first letter of each word capitalized).
 * Run once to fix existing DB entries.
 * Uses MONGO_URI from .env if present.
 *
 * Usage: node src/scripts/normalize-ingredient-names.js
 */

function capitalizeWords(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

async function normalizeIngredientNames() {
  const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/foodfornow';

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const ingredients = await Ingredient.find({});
    let updated = 0;

    for (const ing of ingredients) {
      const normalized = capitalizeWords(ing.name);
      if (normalized !== ing.name) {
        ing.name = normalized;
        await ing.save();
        updated++;
        console.log(`  "${ing.name}" (was different)`);
      }
    }

    console.log(`Done. Updated ${updated} of ${ingredients.length} ingredients.`);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

normalizeIngredientNames();
