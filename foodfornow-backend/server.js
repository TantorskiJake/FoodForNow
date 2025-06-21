/**
 * FoodForNow Backend Server
 * 
 * This is the main entry point for the FoodForNow backend API.
 * It sets up Express server, connects to MongoDB, and configures
 * all middleware and routes for the application.
 */

// Load environment variables from .env file
require("dotenv").config();

// Import required packages
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require('cookie-parser');

// Import API route modules
const authRoutes = require("./src/routes/auth");
const mealPlanRoutes = require("./src/routes/mealplan");
const recipesRoutes = require("./src/routes/recipes");
const pantryRoutes = require("./src/routes/pantry");
const ingredientRoutes = require("./src/routes/ingredients");
const shoppingListRoutes = require("./src/routes/shopping-list");

// Create Express application instance
const app = express();

/**
 * Request Logging Middleware
 * 
 * Logs all incoming requests with timestamp, method, and URL
 * for debugging and monitoring purposes.
 */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * Security Middleware Configuration
 * 
 * helmet: Adds various HTTP headers for security
 * cors: Configures Cross-Origin Resource Sharing
 */
app.use(helmet()); // Adds various HTTP headers for security
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Frontend URL
  credentials: true // Allow cookies to be sent with requests
}));

/**
 * Body Parsing and Cookie Middleware
 * 
 * Configure Express to parse JSON and URL-encoded bodies,
 * and to parse cookies from requests.
 */
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies up to 10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies from requests

/**
 * API Routes Configuration
 * 
 * All routes are prefixed with /api for organization.
 * Each route module handles specific functionality.
 */
app.use("/api/auth", authRoutes);           // Authentication (login, register, etc.)
app.use("/api/mealplan", mealPlanRoutes);   // Meal planning functionality
app.use("/api/recipes", recipesRoutes);     // Recipe management
app.use("/api/pantry", pantryRoutes);       // Pantry management
app.use("/api/ingredients", ingredientRoutes); // Ingredient management
app.use("/api/shopping-list", shoppingListRoutes); // Shopping list functionality

/**
 * Root Route
 * 
 * Simple health check endpoint to verify the API is running.
 */
app.get("/", (req, res) => {
  res.send("FoodForNow API is running");
});

/**
 * Global Error Handling Middleware
 * 
 * Catches any errors that weren't handled by route handlers
 * and returns a generic error response.
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

/**
 * Process Error Handlers
 * 
 * Handle unhandled promise rejections and uncaught exceptions
 * to prevent the server from crashing silently.
 */
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // Exit process on uncaught exceptions
});

/**
 * Server Startup Function
 * 
 * Connects to MongoDB and starts the Express server.
 * Handles startup errors gracefully.
 */
const startServer = async () => {
  try {
    // Get MongoDB connection string from environment variables
    const MONGODB_URI = process.env.MONGO_URI;
    
    // Validate that MongoDB URI is provided
    if (!MONGODB_URI) {
      throw new Error('MONGO_URI environment variable is required');
    }

    // Connect to MongoDB with timeout configurations
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,  // Timeout for server selection
      socketTimeoutMS: 45000,          // Timeout for socket operations
    });
    console.log("MongoDB connected successfully");

    // Start Express server on configured port
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1); // Exit process on startup failure
  }
};

// Start the server
startServer();