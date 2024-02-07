const User = require("../models/userModel");
const multer = require("multer");
const express = require("express");
const bcrypt = require("bcrypt");

// Get user details
async function getUserDetails(req, res) {
  console.log("in userDetails");
  try {
    // Get the authenticated user's ID from the req.user object
    const userId = req.user._id;

    // Find the user in the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user details
    res.json({ success: true, count: 1, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error in usersController" });
  }
  console.log("OUT userDetails");
}

// Update user information
async function updateUser(req, res) {
  try {
    // Get the authenticated user's ID from the req.user object
    const userId = req.user._id;

    // Find the user in the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Check if the authenticated user is the owner of the account
    if (userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    // Update the user information
    user.name = req.body.name;
    user.email = req.body.email;
    user.username = req.body.username;
    user.password = req.body.password;
    user.fullName = req.body.fullName;
    user.phoneNumber = req.body.phoneNumber;
    user.cv = req.body.cv;

    // Save the updated user
    const updatedUser = await user.save();

    // Return the updated user details
    res.json({ message: "User Updated successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error in updateUser Function" });
  }
}

// Delete user account
async function deleteUser(req, res) {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    // Find the user in the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the provided password matches the current user's password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Delete the user from the database
    await user.remove();

    // Return a success message
    res.json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error in deleteUser function" });
  }
}

async function getUserByEmail(req, res) {
  try {
    const email = req.params.email;
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

async function editProfile(req, res) {
  console.log("IN the editProfile Function");
  console.log(req.files);
  try {
    // const profile = req.file ? req.file.path : null;

    // console.log(profile);
    // console.log(req.file);
    // Check if the profile image and cv files were uploaded
    if (!req.files || !req.files.profile || !req.files.cv) {
      return res
        .status(400)
        .json({ message: "Both profile and cv files are required." });
    }

    // Get the updated profile information from the request body
    const { phoneNumber, fullName } = req.body;

    // Find the user by ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's profile information
    user.phoneNumber = phoneNumber;
    user.fullName = fullName;
    // user.email = email;
    // Save the file paths to the user's cv and profile fields
    user.cv = req.files.cv[0].path;
    user.profile = req.files.profile[0].path;
    // Save the updated user profile
    const updatedUser = await user.save();

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error in editProfile function" });
  }
}
// Function to change the email of the logged-in user
async function changeEmail(req, res) {
  const { email, confirmEmail } = req.body;
  // Check if the email and confirmEmail match
  if (email !== confirmEmail) {
    return res.status(400).json({ error: "Emails do not match" });
  }
  // Check if the new email is already in use by another user
  const existingEmail = await User.findByEmail(email);
  if (existingEmail && existingEmail._id.toString() !== userId.toString()) {
    return res.status(409).json({ error: "Email already in use" });
  }
  try {
    // Get the logged-in user's ID from req.user
    const userId = req.user._id;

    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the email of the user
    user.email = email;
    await user.save();

    res.json({ success: true, message: "Email changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
// Controller function to fetch all users
async function getAllUsers(req, res) {
  try {
    // Fetch all users from the database
    const users = await User.find();

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
async function addNotification(req, res) {
  console.log("IN ADDNOti");
  try {
    const notif = req.params.notif;
    const userId = req.params.userId;
    console.log(notif);
    console.log(userId);
    // Check if user is authenticated
    // if (!req.user) {
    //   return res.status(401).json({ error: "Unauthorized Access" });
    // }

    // Find the user in the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.noti.push(notif);

    // Save the updated user with the new applied job
    await user.save();

    res.json({
      success: true,
      data: user.noti,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error in addNoti" });
  }
}
// Get notifications for a specific user by userId
async function getNotifications(req, res) {
  console.log("In GetNoti");
  try {
    const userId = req.user._id;
    console.log(userId);
    // Find the user by userId
    const user = await User.findById(userId);
    console.log(user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract the 'Noti' array from the user document
    const notifications = user.noti;
    console.log(notifications);
    // Return the notifications
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
// Clear the Noti array for a specific user by userId
async function clearNotifications(req, res) {
  try {
    const userId = req.user._id;

    // Find the user by userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's Noti array to an empty array
    user.noti = [];

    // Save the updated user document
    await user.save();

    res.json({ success: true, message: "Notifications cleared successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
module.exports = {
  getUserDetails,
  updateUser,
  deleteUser,
  getUserByEmail,
  editProfile,
  changeEmail,
  getAllUsers,
  addNotification,
  getNotifications,
  clearNotifications,
};
