const mongoose = require('mongoose');
const Ingredient = require('../models/ingredient');
require('dotenv').config();

const basicIngredients = [
  {
    name: 'Milk',
    category: 'Dairy',
    description: 'Fresh dairy milk'
  },
  {
    name: 'Lobster',
    category: 'Seafood',
    description: 'Fresh lobster'
  },
  {
    name: 'Butter',
    category: 'Dairy',
    description: 'Unsalted butter'
  }
];

async function seedIngredients() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the first user ID from the database
    const userId = process.env.SEED_USER_ID; // You'll need to set this in your .env file
    if (!userId) {
      throw new Error('SEED_USER_ID not set in .env file');
    }

    // Add user ID to each ingredient
    const ingredientsWithUser = basicIngredients.map(ing => ({
      ...ing,
      user: userId
    }));

    // Insert ingredients
    const result = await Ingredient.insertMany(ingredientsWithUser, { ordered: false });
    console.log('Added ingredients:', result);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error seeding ingredients:', err);
    process.exit(1);
  }
}

seedIngredients(); 