const mongoose = require("mongoose");

/**
 * Recipe Schema - Defines the structure for recipes in the application
 * 
 * This model stores complete recipe information including ingredients,
 * instructions, timing, and metadata. Each recipe belongs to a user
 * and can be used in meal planning.
 */
const recipeSchema = new mongoose.Schema({
  // Recipe name - displayed in UI and used for search
  name: {
    type: String,
    required: true
  },
  // Recipe description - provides context about the dish
  description: {
    type: String,
    required: true
  },
  // List of ingredients with quantities and units
  ingredients: [{
    // Reference to the ingredient document
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true
    },
    // Amount of the ingredient needed
    quantity: {
      type: Number,
      required: true
    },
    // Unit of measurement for the ingredient
    unit: {
      type: String,
      required: true,
      enum: ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'pinch', 'box']
    }
  }],
  // Step-by-step cooking instructions
  instructions: [{
    type: String,
    required: true
  }],
  // Preparation time in minutes
  prepTime: {
    type: Number,
    required: true
  },
  // Cooking time in minutes
  cookTime: {
    type: Number,
    required: true
  },
  // Number of servings the recipe makes
  servings: {
    type: Number,
    required: true
  },
  // Optional tags for categorization and search
  tags: [{
    type: String
  }],
  // User who created this recipe
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true
});

// Create compound index for user and name to ensure unique recipes per user
// This prevents duplicate recipe names within a user's collection
recipeSchema.index(
  { createdBy: 1, name: 1 },
  {
    unique: true,
    collation: { locale: 'en', strength: 2 }, // Case-insensitive comparison
  }
);

// Export the Recipe model
module.exports = mongoose.model("Recipe", recipeSchema);