const bcrypt = require('bcrypt');
const User = require('../models/user');

const createUser = async (userData) => {
  try {
    const { username, password } = userData;

    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      const error = new Error('Username already exists');
      error.statusCode = 400; // Set a custom status code for validation error
      throw error;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user without specifying _id
    const newUser = new User({ username, password: hashedPassword });
    
    // Save the new user to the database
    await newUser.save();

    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId).exec();
    return user;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
};

module.exports = {
  createUser,
  getUserById,
};
