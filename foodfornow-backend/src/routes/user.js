const express = require("express");
const escapeHTML = (str) => {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return str.replace(/[&<>"']/g, (m) => map[m]);
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const User = require("../models/user");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Get user profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ data: user });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Update user profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validate inputs
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    if (!isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const sanitizedData = {
      name: escapeHTML(name),
      email: normalizeEmail(email),
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      sanitizedData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ error: "User not found" });
    res.json({ data: updatedUser });
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(400).json({ error: "Failed to update user profile" });
  }
});

// Delete user account
router.delete("/profile", authMiddleware, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user.id);
    if (!deletedUser) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User account deleted successfully" });
  } catch (err) {
    console.error("Error deleting user account:", err);
    res.status(500).json({ error: "Failed to delete user account" });
  }
});

module.exports = router;