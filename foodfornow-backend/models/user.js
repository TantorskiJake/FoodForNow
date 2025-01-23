const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cookbook: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }], // User's saved recipes
  shoppingList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Pantry" }], // Items the user needs
});

// Hash password before saving the user
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", UserSchema);
