/* ============================================================
   JWT Utility
   ============================================================
   - Generate access & refresh tokens
   - Verify tokens
   ============================================================ */

const jwt = require("jsonwebtoken");
const config = require("../config/env");

/**
 * Generate an access token (short-lived).
 * @param {string} userId
 * @returns {string} JWT
 */
function generateAccessToken(userId) {
  return jwt.sign({ id: userId, type: "access" }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
}

/**
 * Generate a refresh token (long-lived).
 * @param {string} userId
 * @returns {string} JWT
 */
function generateRefreshToken(userId) {
  return jwt.sign({ id: userId, type: "refresh" }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  });
}

/**
 * Verify an access token.
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {Error} if invalid
 */
function verifyAccessToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {Error} if invalid
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
