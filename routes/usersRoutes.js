const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const authMiddleware = require("../middlewares/authMiddleware");
const authController = require("../controllers/authController");
const usersController = require("../controllers/usersController");

// Create a storage for multer to save the uploaded file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "controllers/uploads/userData"); // Change this to the directory where you want to save the files
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
  },
});
// Create a multer middleware with the storage configuration
const upload = multer({ storage: storage });

// Create a storage for multer to save the uploaded file
const storage0 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "controllers/uploads/pp/"); // Directory to save the files
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
  },
});

const upload0 = multer({ storage: storage0 });

// Authentication routes
router.post("/login", authController.login);
router.post("/signup", authController.signup);

// User profile routes
// router.use(authMiddleware);
// Apply authentication middleware to protect routes
router.get("/profile/:id", usersController.getUserDetails);
router.get("/", usersController.getAllUsers);

router.patch("/profile", upload.single("profile"), usersController.updateUser);
router.post("/profile", usersController.deleteUser);
router.post("/changeEmail", usersController.changeEmail);
router.post("/addNoti/:notif/:userId", usersController.addNotification);
router.get("/getNoti", usersController.getNotifications);
router.post("/clearNoti", usersController.clearNotifications);
router.post(
  "/editProfile",
  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "cv", maxCount: 1 },
  ]),
  usersController.editProfile
);

module.exports = router;
