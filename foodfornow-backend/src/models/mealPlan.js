const mongoose = require("mongoose");

/**
 * Meal Plan Schema - Defines the structure for meal planning in the application
 * 
 * This model represents individual meals scheduled for specific days and times.
 * Each meal plan item links a recipe to a specific day and meal type (breakfast, lunch, dinner).
 * The model tracks cooking status and allows for notes.
 */
const mealPlanSchema = new mongoose.Schema(
  {
    // User who owns this meal plan item
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // Start date of the week this meal belongs to (Monday)
    // Used for organizing meals by week
    weekStart: {
      type: Date,
      required: true
    },
    // Day of the week for this meal
    day: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    },
    // Type of meal (breakfast, lunch, dinner, or snack)
    meal: {
      type: String,
      required: true,
      enum: ["Breakfast", "Lunch", "Dinner", "Snack"]
    },
    // Reference to the recipe for this meal (optional when eatingOut is true)
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe"
    },
    // Whether this meal is eating out (restaurant) vs cooking at home
    eatingOut: {
      type: Boolean,
      default: false
    },
    // Restaurant details when eating out
    restaurant: {
      name: { type: String },
      url: { type: String },
      address: { type: String },
      notes: { type: String }
    },
    // Optional notes about the meal (e.g., modifications, preferences)
    notes: {
      type: String
    },
    // Whether the meal has been cooked/prepared
    // Used for tracking meal preparation progress
    cooked: {
      type: Boolean,
      default: false
    }
  },
  { 
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true 
  }
);

// Validate: must have either recipe OR (eatingOut + restaurant name)
mealPlanSchema.pre('save', function (next) {
  if (this.eatingOut) {
    if (!this.restaurant?.name) {
      return next(new Error('Restaurant name is required when eating out'));
    }
  } else {
    if (!this.recipe) {
      return next(new Error('Recipe is required when not eating out'));
    }
  }
  next();
});

// Non-unique compound index for efficient queries (multiple meals per slot allowed).
// If you previously had a unique index on these fields, run: db.mealplans.dropIndex('user_1_weekStart_1_day_1_meal_1')
mealPlanSchema.index({ user: 1, weekStart: 1, day: 1, meal: 1 });
// Supports cooked-meal history queries used by achievement progress checks.
mealPlanSchema.index({ user: 1, cooked: 1, createdAt: 1 });

// Export the MealPlan model
module.exports = mongoose.model("MealPlan", mealPlanSchema);
