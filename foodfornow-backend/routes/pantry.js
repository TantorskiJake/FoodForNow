const express = require("express");
const Pantry = require("../models/pantry");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Get all pantry items
router.get("/", authMiddleware, async (req, res) => {
  try {
    const pantryItems = await Pantry.find({ user: req.user.id });
    res.json(pantryItems);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pantry items" });
  }
});

// Add a new pantry item
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, quantity, unit, expirationDate } = req.body;
    const newItem = new Pantry({
      name,
      quantity,
      unit,
      expirationDate,
      user: req.user.id,
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ error: "Failed to add pantry item" });
  }
});

// Update a pantry item
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, quantity, unit, expirationDate } = req.body;
    const updatedItem = await Pantry.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name, quantity, unit, expirationDate },
      { new: true }
    );
    if (!updatedItem) return res.status(404).json({ error: "Item not found" });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: "Failed to update pantry item" });
  }
});

// Delete a pantry item
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedItem = await Pantry.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!deletedItem) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete pantry item" });
  }
});

module.exports = router;
