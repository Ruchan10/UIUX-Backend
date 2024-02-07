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

// Function to read common passwords from a file
const loadCommonPasswords = () => {
  try {
    const data = fs.readFileSync("passwords.txt", "utf8");
    return data.split("\n").map((password) => password.trim().toLowerCase());
  } catch (err) {
    console.error("Error reading common passwords file", err);
    return [];
  }
};

const commonPasswords = loadCommonPasswords();

// Signup a new user
async function signup(req, res) {
  console.log("INSDIE SIGNUP");
  const { email, password } = req.body;
  // Check against common passwords
  if (commonPasswords.includes(password)) {
    return res.status(200).json({ error: "Password is too common" });
  }
  // Check if the email is already taken
  const existingEmail = await User.findByEmail(email);
  if (existingEmail) {
    return res.status(200).json({ error: "Email already exists" });
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

// Login a user
async function login(req, res) {
  console.log("INSDIE LOGIN");
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(201).json({ error: "Fields cannot be left empty" });
    }

    // Find the user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(201).json({ error: "Invalid email or password" });
    }

    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log(user.failedLoginAttempts);
      // If login fails, increment the failed login attempts count
      user.failedLoginAttempts += 1;
      await user.save();
      // Check if the user is locked out due to too many failed attempts
      const maxFailedAttempts = 3; // Adjust as needed
      if (user.failedLoginAttempts >= maxFailedAttempts) {
        // Implement time delay logic
        const baseDelay = 10000; // 1 second base delay
        user.loginDelay = baseDelay * (user.failedLoginAttempts - 1);
        await user.save();

        // Add a delay before responding to the user
        await new Promise((resolve) => setTimeout(resolve, user.loginDelay));
        return res.status(201).json({
          error:
            "Account locked Try again in " +
            user.loginDelay / 1000 +
            " seconds",
        });
      }

      return res.status(201).json({ error: "Invalid email or password" });
    }

    // If login is successful, reset the failed login attempts count
    user.failedLoginAttempts = 0;
    user.loginDelay = 0;
    await user.save();

    // Create and sign a JWT token with 30 days expiration
    const token = jwt.sign({ userId: user._id }, secretKey, {
      expiresIn: "30d", // 30 days expiration
    });

    // Check if password change is required
    const passwordChangeInterval = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
    const requirePasswordChange =
      user.lastPasswordChange < Date.now() - passwordChangeInterval;

    // Set the token as a cookie in the response
    res.cookie("token", token, { httpOnly: true });

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user,
      requirePasswordChange,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
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
};
