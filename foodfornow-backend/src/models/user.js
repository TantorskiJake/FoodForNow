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
  }
}, {
  // Automatically add createdAt and updatedAt timestamps
  timestamps: true
});

// Export the User model
module.exports = mongoose.model("User", userSchema);