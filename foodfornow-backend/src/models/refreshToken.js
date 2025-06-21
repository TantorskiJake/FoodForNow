const mongoose = require("mongoose");

/**
 * Refresh Token Schema - Defines the structure for JWT refresh tokens
 * 
 * This model stores refresh tokens used for secure authentication.
 * Refresh tokens allow users to get new access tokens without re-authentication.
 * Tokens are automatically expired and can be revoked for security.
 */
const RefreshTokenSchema = new mongoose.Schema(
  {
    // The actual refresh token string
    token: { 
      type: String, 
      required: true, 
      unique: true 
    },
    // User who owns this refresh token
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    // When the token expires (for automatic cleanup)
    expiresAt: { 
      type: Date, 
      required: true 
    },
    // Whether the token has been manually revoked
    // Used for immediate token invalidation
    isRevoked: { 
      type: Boolean, 
      default: false 
    },
  },
  { 
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true 
  }
);

// Index for automatic cleanup of expired tokens
// MongoDB will automatically delete documents when expiresAt is reached
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Export the RefreshToken model
module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);

