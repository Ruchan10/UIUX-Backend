const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const imagesFolderPath = path.join(__dirname, "uploads", "logos");
const imagesFolderPath0 = path.join(__dirname, "uploads", "userData");

router.get("/uploads/logos/:imageName", (req, res) => {
  try {
    const imageName = req.params.imageName;

    const imagePath = path.join(imagesFolderPath, imageName);
    console.log(imagePath);
    // Check if the image exists
    if (fs.existsSync(imagePath)) {
      // Send the image file as a response
      res.sendFile(imagePath);
    } else {
      // If the image does not exist, return a 404 error
      res.status(404).json({ error: "Image not found" });
    }
  } catch (error) {
    console.error(error);
  }
});
router.get("/uploads/userData/:imageName", (req, res) => {
  console.log("inside getProfile");
  try {
    const imageName = req.params.imageName;

    const imagePath = path.join(imagesFolderPath0, imageName);
    console.log(imagePath);
    // Check if the image exists
    if (fs.existsSync(imagePath)) {
      // Send the image file as a response
      res.sendFile(imagePath);
    } else {
      // If the image does not exist, return a 404 error
      res.status(404).json({ error: "Image not found" });
    }
  } catch (error) {
    console.error(error);
  }
});
module.exports = router;
