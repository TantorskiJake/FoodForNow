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

// Initialize app
const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse JSON bodies

// Debugging: Check route types before using them
console.log("authRoutes:", typeof authRoutes);
console.log("userRoutes:", typeof userRoutes);
console.log("pantryRoutes:", typeof pantryRoutes);
console.log("recipeRoutes:", typeof recipeRoutes);
console.log("mealPlanRoutes:", typeof mealPlanRoutes);

// Routes
if (typeof authRoutes === "function") app.use("/auth", authRoutes);
else console.error("Error: Invalid export in ./routes/auth");

if (typeof userRoutes === "function") app.use("/user", userRoutes);
else console.error("Error: Invalid export in ./routes/user");

if (typeof pantryRoutes === "function") app.use("/pantry", pantryRoutes);
else console.error("Error: Invalid export in ./routes/pantry");

if (typeof recipeRoutes === "function") app.use("/recipes", recipeRoutes);
else console.error("Error: Invalid export in ./routes/recipes");

if (typeof mealPlanRoutes === "function") app.use("/meal-plans", mealPlanRoutes);
else console.error("Error: Invalid export in ./routes/mealPlans");

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the FoodForNow API!");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));