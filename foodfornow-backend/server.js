require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const pantryRoutes = require("./routes/pantry");
const recipeRoutes = require("./routes/recipes");
const mealPlanRoutes = require("./routes/mealPlans");
const ingredientRoutes = require("./routes/ingred"); // Add the ingredient routes

// Middleware imports
const errorHandler = require("./middleware/errorHandler"); // Centralized error handler

// Initialize app
const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse JSON bodies

// Debugging: Log route registration
console.log("Registering routes...");

// Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/pantry", pantryRoutes);
app.use("/recipes", recipeRoutes);
app.use("/meal-plans", mealPlanRoutes);
app.use("/ingred", ingredientRoutes); // Register the ingredient routes

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the FoodForNow API!");
});

// Error handling middleware (must be the last middleware)
app.use(errorHandler);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process if the database connection fails
  });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));