const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for a user
 * @param {string} userId - User ID to include in token
 * @returns {string} JWT token
 */
exports.generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'html-city-secret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object|null} Decoded token or null if invalid
 */
exports.verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'html-city-secret');
  } catch (err) {
    return null;
  }
};