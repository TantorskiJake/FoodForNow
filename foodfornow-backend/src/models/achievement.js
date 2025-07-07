const mongoose = require("mongoose");

/**
 * Achievement Schema - Defines the structure for user achievements
 * 
 * This model stores user achievement progress and completion status.
 * Achievements are unlocked based on user actions and milestones.
 */
const achievementSchema = new mongoose.Schema({
  // User who earned the achievement
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Achievement identifier
  achievementId: {
    type: String,
    required: true
  },
  // Achievement name
  name: {
    type: String,
    required: true
  },
  // Achievement description
  description: {
    type: String,
    required: true
  },
  // Achievement category
  category: {
    type: String,
    enum: ['getting-started', 'recipe-mastery', 'meal-planning', 'pantry-shopping', 'fun', 'milestone'],
    required: true
  },
  // Achievement icon/emoji
  icon: {
    type: String,
    required: true
  },
  // Current progress (for achievements that require multiple steps)
  progress: {
    type: Number,
    default: 0
  },
  // Required progress to complete
  requiredProgress: {
    type: Number,
    default: 1
  },
  // Whether achievement is completed
  completed: {
    type: Boolean,
    default: false
  },
  // Date when achievement was completed
  completedAt: {
    type: Date
  },
  // Date when achievement was first unlocked (started progress)
  unlockedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure unique achievements per user
achievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

// Export the Achievement model
module.exports = mongoose.model("Achievement", achievementSchema); 