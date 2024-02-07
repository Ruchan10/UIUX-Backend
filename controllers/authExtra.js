const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");

// Provide a secret key
const secretKey = "mySecretKey";
const cvsFolderPath = path.join(__dirname, "uploads", "cvs");

const crypto = require("crypto");

// Update the User model to include lastPasswordChange
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  failedLoginAttempts: { type: Number, default: 0 },
  lastPasswordChange: { type: Date, default: Date.now }, // Add this field
});
// Signup a new user
async function signup(req, res) {
  console.log("INSIDE SIGNUP");
  const { email, password } = req.body;

  // Check if the email is already taken
  const existingEmail = await User.findByEmail(email);
  if (existingEmail) {
    return res.status(200).json({ error: "Email already exists" });
  }
  if (password.length < 6) {
    return res
      .status(200)
      .json({ error: "Password must be at least 6 characters long" });
  }

  // Email validation: Check for '@' and '.com'
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    return res.status(200).json({ error: "Email must contain @ and .com" });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      email,
      password: hashedPassword,
      lastPasswordChange: Date.now(), // Set the initial value
    });

    // Save the user to the database
    const createdUser = await newUser.save();

    res
      .status(201)
      .send({ message: "User created successfully", user: createdUser });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
}

// Middleware to check if password change is required
function forcePasswordChange(req, res, next) {
  const user = req.user; // Assuming you set the user in the request object during authentication

  // Check if password change is required
  const passwordChangeInterval = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

  if (user.lastPasswordChange < Date.now() - passwordChangeInterval) {
    return res.status(401).json({
      error: "Password change required. Please update your password.",
    });
  }

  // If not, proceed to the next middleware or route
  next();
}

// Update the login function to check for password change after a successful login
async function login(req, res) {
    console.log("INSDIE LOGIN");
    try {
      const { email, password } = req.body;
      console.log(email);
      console.log(password);
  
      // Validate inputs
      if (!email || !password) {
        return res.status(201).json({ error: "Fields cannot be left empty" });
      }
  
      // Find the user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(201).json({ error: "Invalid email or password" });
      }
  
      // Check if the user is locked out due to too many failed attempts
      if (user.failedLoginAttempts >= 3) {
        // Implement a delay or lockout mechanism, e.g., return a 401 status
        // code with a message indicating that the account is locked
        return res.status(401).json({
          error:
            "Account locked due to multiple failed login attempts. Try again later.",
        });
      }
  
      // Compare the provided password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordMatch) {
        // If login fails, increment the failed login attempts count
        user.failedLoginAttempts += 1;
        await user.save();
  
        return res.status(201).json({ error: "Invalid email or password" });
      }
  
      // If login is successful, reset the failed login attempts count
      user.failedLoginAttempts = 0;
      await user.save();
  
      // Check if password change is required
      const passwordChangeInterval = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
      if (user.lastPasswordChange < Date.now() - passwordChangeInterval) {
        return res.status(401).json({
          error: "Password change required. Please update your password.",
        });
      }
  
      // Determine if the user is an admin or customer based on the role field
      const userType = user.role === 'admin' ? 'admin' : 'customer';
  
      // Create and sign a JWT token with 30 days expiration
      const token = jwt.sign({ userId: user._id, userType }, secretKey, {
        expiresIn: "30d", // 30 days expiration
      });
  
      // Set the token as a cookie in the response
      res.cookie("token", token, { httpOnly: true });
  
      res.json({ success: true, message: "Login successful", token, user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
  

async function getUserDetails(req, res) {
  try {
    const userId = req.params.id;
    // Find the user by the provided ID
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
async function getImage(req, res) {
  try {
    const imageName = req.params.imageName;

    // Construct the path to the images folder inside the current working directory
    const logosFolderPath = path.join(__dirname, "uploads", "logos");
    const imagesFolderPath = path.join(__dirname, "uploads", "userData");

    const logoImagePath = path.join(logosFolderPath, imageName);
    const generalImagePath = path.join(imagesFolderPath, imageName);

    // Check if the image exists in "uploads/logos"
    if (fs.existsSync(logoImagePath)) {
      // Send the image file as a response
      res.sendFile(logoImagePath);
    }
    // Check if the image exists in "uploads"
    else if (fs.existsSync(generalImagePath)) {
      // Send the image file as a response
      res.sendFile(generalImagePath);
    } else {
      // If the image does not exist, return a 404 error
      res.status(404).json({ error: "Image not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getCv(req, res) {
  console.log("in get CV");
  try {
    const fileName = req.params.fileName;
    const filePath = path.resolve(cvsFolderPath, fileName);
    console.log(filePath);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Check if the file has the .pdf extension
      if (path.extname(filePath) === ".pdf") {
        // Send the file as a response
        res.sendFile(filePath);
      } else {
        // If the file does not have the .pdf extension, return a 400 Bad Request error
        res
          .status(400)
          .json({ error: "Invalid file format. Only .pdf files are allowed." });
      }
    } else {
      // If the file does not exist, return a 404 error
      res.status(404).json({ error: "File not found" });
    }
  } catch (e) {
    console.error(e);
  }
}
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword, reenterNewPassword } = req.body;
    const userId = req.user._id;

    // Validate input data
    if (!currentPassword || !newPassword || !reenterNewPassword) {
      return res.status(401).json({ error: "All fields are required" });
    }

    if (newPassword !== reenterNewPassword) {
      return res.status(401).json({ error: "New passwords do not match" });
    }

    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare the current password with the one stored in the database
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    user.password = hashedPassword;

    // Save the updated user data
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
// Controller function to delete a user
async function deleteUser(req, res) {
  try {
    const userId = req.params.userId;

    // Delete the user from the database
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
module.exports = {
  signup,
  login,
  getUserDetails,
  getImage,
  getCv,
  changePassword,
  deleteUser,
  forcePasswordChange,
};
