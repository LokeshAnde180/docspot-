// backend/middleware/auth.js
// This middleware is used to protect routes, verify JWTs, and attach user data to the request.

const jwt = require('jsonwebtoken'); // Import jsonwebtoken for JWT operations
const config = require('config'); // Import config to get jwtSecret

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token'); // Expect token in 'x-auth-token' header

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    // Verify the token using the JWT secret from config
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    // Attach the decoded user object (which contains user ID and role) to the request
    req.user = decoded.user;
    next(); // Move to the next middleware/route handler
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' }); // Token is invalid (e.g., expired, malformed)
  }
};
