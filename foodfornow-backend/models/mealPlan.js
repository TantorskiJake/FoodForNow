const mongoose = require("mongoose");

const MealPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Associated user
    week: { 
      type: String, 
      required: true, 
      match: [/^\d{4}-W\d{2}$/, "Invalid week format. Use YYYY-WW (e.g., 2025-W03)"] 
    }, // Ensures consistency in week format
    meals: [
      {
        day: {
          type: String,
          required: true,
          enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], // Validate day
        },
        recipe: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Recipe", 
          required: true,
          validate: {
            validator: async function (value) {
              const recipeExists = await mongoose.model("Recipe").findById(value);
              return !!recipeExists;
            },
            message: "Invalid recipe ID"
          }
        }, // Linked recipe
      },
    ],
  },
  { timestamps: true } // Auto adds createdAt and updatedAt fields
);

// Ensure no duplicate days in a single meal plan
MealPlanSchema.index({ user: 1, week: 1, "meals.day": 1 }, { unique: true });

module.exports = mongoose.model("MealPlan", MealPlanSchema);