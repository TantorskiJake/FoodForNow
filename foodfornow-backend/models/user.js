const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cookbook: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }], // User's saved recipes
  shoppingList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Pantry" }], // Items the user needs
});

module.exports = mongoose.model("User", UserSchema);