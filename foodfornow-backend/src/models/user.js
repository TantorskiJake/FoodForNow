const mongoose = require("mongoose");

/**
 * User Schema - Defines the structure for user accounts in the application
 * 
 * This model stores user authentication and profile information.
 * Users can create recipes, manage their pantry, and plan meals.
 */
const userSchema = new mongoose.Schema({
  // User's email address - used for login and must be unique
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Remove whitespace
    lowercase: true // Store emails in lowercase for consistency
  },
  // Hashed password for secure authentication
  password: {
    type: String,
    required: true
  },
  // User's display name
  name: {
    type: String,
    required: true,
    trim: true // Remove leading/trailing whitespace
  },
  // User's bio/description
  bio: {
    type: String,
    trim: true,
    maxlength: 500 // Limit bio length
  },
  // User's location
  location: {
    type: String,
    trim: true,
    maxlength: 100
  },
  // User's website
  website: {
    type: String,
    trim: true,
    maxlength: 200
  },
  // User's profile picture URL
  profilePicture: {
    type: String,
    trim: true
  },
  // User preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    units: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  // Notification settings
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    mealReminders: {
      type: Boolean,
      default: true
    },
    shoppingReminders: {
      type: Boolean,
      default: true
    }
  }
}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true
});

// Export the User model
module.exports = mongoose.model("User", userSchema);