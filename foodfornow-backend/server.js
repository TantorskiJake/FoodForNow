require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require('cookie-parser');

// Import routes
const authRoutes = require("./src/routes/auth");
const mealPlanRoutes = require("./src/routes/mealplan");
const recipesRoutes = require("./src/routes/recipes");
const pantryRoutes = require("./src/routes/pantry");
const ingredientRoutes = require("./src/routes/ingredients");
const shoppingListRoutes = require("./src/routes/shopping-list");

const app = express();

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Security middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Frontend URL
  credentials: true
}));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later'
// });
// app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Routes - all routes now have /api prefix
app.use("/api/auth", authRoutes);
app.use("/api/mealplan", mealPlanRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/pantry", pantryRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/shopping-list", shoppingListRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("FoodForNow API is running");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB Atlas
    const MONGODB_URI = process.env.MONGO_URI || "mongodb+srv://JakeTantorski:JakeTantorski@ffn-cluster.bsetl.mongodb.net/foodfornow";
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB connected");

    // Start Express server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();