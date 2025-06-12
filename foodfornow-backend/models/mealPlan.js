const mongoose = require("mongoose");

const mealPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    weekStart: {
      type: Date,
      required: true
    },
    day: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    },
    meal: {
      type: String,
      required: true,
      enum: ["Breakfast", "Lunch", "Dinner", "Snack"]
    },
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true
    },
    notes: {
      type: String
    },
    groceryList: [
      {
        name: {
          type: String,
          required: true
        },
        amount: {
          type: Number,
          required: true
        },
        unit: {
          type: String,
          required: true
        },
        purchased: {
          type: Boolean,
          default: false
        }
      }
    ]
  },
  { timestamps: true }
);

// Drop any existing indexes
mealPlanSchema.indexes().forEach(index => {
  mealPlanSchema.index(index[0], { unique: false });
});

// Add the correct unique index
mealPlanSchema.index({ user: 1, weekStart: 1, day: 1, meal: 1 }, { unique: true });

module.exports = mongoose.model("MealPlan", mealPlanSchema);