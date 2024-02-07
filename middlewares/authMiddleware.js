const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();

const secretKey = 'mySecretKey';
// Authentication middleware
async function authMiddleware(req, res, next) {
    try {
      // Get the token from the request headers
      const token = req.headers.authorization;
  
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized Access' });
      }
  
      // Verify the token
      const decoded = jwt.verify(token, secretKey);
  
      // Find the user in the database, including the bookmarked jobs
      const user = await User.findById(decoded.userId).populate('bookmarkedJobs');
  
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized Access' });
      }
  
      // Attach the authenticated user to the request object
      req.user = user;
  
      // Proceed to the next middleware or route handler
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error in AuthMiddleware' });
    }
  }
  
  module.exports = authMiddleware;
  
  