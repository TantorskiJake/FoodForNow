const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  cookbook: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  }],
  shoppingList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Pantry" }], // Items the user needs
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);