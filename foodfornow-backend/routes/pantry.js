const express = require("express");
const Pantry = require("../models/pantry");
const Ingredient = require("../models/ingred");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Get all pantry items
router.get("/", authMiddleware, async (req, res) => {
  try {
    const pantry = await Pantry.findOne({ user: req.user.id }).populate("items.ingredient");
    if (!pantry) return res.status(404).json({ error: "Pantry not found" });
    res.json(pantry.items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pantry items" });
  }
});

// Add or update a pantry item
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { ingredient, quantity, unit } = req.body;

    console.log("Pantry Item Add Request:", { ingredient, quantity, unit }); // Log request body

    // Validate ingredient
    const validIngredient = await Ingredient.findById(ingredient);
    if (!validIngredient) {
      console.error("Invalid ingredient ID:", ingredient); // Log invalid ingredient
      return res.status(400).json({ error: "Invalid ingredient ID" });
    }

    const pantry = await Pantry.findOne({ user: req.user.id });
    console.log("User's Pantry:", pantry); // Log user's pantry before adding item

    if (!pantry) {
      const newPantry = new Pantry({
        user: req.user.id,
        items: [{ ingredient, quantity, unit }],
      });
      await newPantry.save();
      console.log("New Pantry Created:", newPantry); // Log new pantry
      return res.status(201).json(newPantry);
    }

    // Check if the ingredient already exists in the pantry
    const itemIndex = pantry.items.findIndex(
      (item) => item.ingredient.toString() === ingredient && item.unit === unit
    );
    console.log("Existing Pantry Item Index:", itemIndex); // Log index of existing item

    if (itemIndex > -1) {
      pantry.items[itemIndex].quantity += quantity;
    } else {
      pantry.items.push({ ingredient, quantity, unit });
    }

    const updatedPantry = await pantry.save();
    console.log("Updated Pantry:", updatedPantry); // Log updated pantry
    res.status(201).json(updatedPantry);
  } catch (err) {
    console.error("Error adding pantry item:", err.message); // Log detailed error
    res.status(400).json({ error: "Failed to add pantry item" });
  }
});

// Delete a pantry item
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const pantry = await Pantry.findOne({ user: req.user.id });
    if (!pantry) return res.status(404).json({ error: "Pantry not found" });

    const itemIndex = pantry.items.findIndex((item) => item._id.toString() === req.params.id);
    if (itemIndex === -1) return res.status(404).json({ error: "Item not found" });

    pantry.items.splice(itemIndex, 1);
    await pantry.save();

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete pantry item" });
  }
});

module.exports = router;