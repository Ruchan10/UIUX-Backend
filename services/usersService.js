const User = require('../models/userModel');

// Get user by ID
async function getUserById(userId) {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    throw new Error('Failed to fetch user');
  }
}

// Get user by email
async function getUserByEmail(email) {
  try {
    const user = await User.findOne({ email });
    return user;
  } catch (error) {
    throw new Error('Failed to fetch user');
  }
}

// Create a new user
async function createUser(userData) {
  try {
    const user = new User(userData);
    await user.save();
    return user;
  } catch (error) {
    throw new Error('Failed to create user');
  }
}

module.exports = {
  getUserById,
  getUserByEmail,
  createUser,
};
