// lsof -i :3000
// kill -9 PID

const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const { logAPICall } = require("./logs.js");
const app = express();
const https = require("https");
const fs = require("fs");

// Specify the paths to your SSL key and certificate files
const privateKey = fs.readFileSync("./key.pem", "utf8");
const certificate = fs.readFileSync("./cert.pem", "utf8");

const credentials = {
  key: privateKey,
  cert: certificate,
};

// Create an HTTPS server
const httpsServer = https.createServer(credentials, app);

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/the_job_finder")
  .then(() => console.log("Connected to MONGOdb Server"))
  .catch((err) => console.log(err));

// Custom middleware
app.get("/", (req, res) => {
  res.send("API is working");
});

// Middleware
app.use(express.json());
//Audit logging
app.use(logAPICall);

// Routes
const authMiddleware = require("./middlewares/authMiddleware.js");
const authRoutes = require("./routes/authRoutes");
const jobsRoutes = require("./routes/jobsRoutes");
const usersRoutes = require("./routes/usersRoutes");
const searchRoutes = require("./routes/searchRoutes");
const fileController = require("./controllers/fileController");
const searchController = require("./controllers/searchController");

app.use("/auth", authRoutes);
app.use("/jobs", jobsRoutes);
app.use("/controllers", fileController);
app.use("/users", authMiddleware, usersRoutes);
app.use("/search", searchRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error in index" });
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

module.exports = app;
