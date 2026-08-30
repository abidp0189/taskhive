const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

/**
 * Verify JWT access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Generate refresh token (opaque UUID)
 */
const generateRefreshToken = () => {
  return uuidv4() + '-' + uuidv4(); // long random token
};

/**
 * Generate unique referral code
 */
const generateReferralCode = (name = '') => {
  const prefix = name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${suffix}`;
};

module.exports = { generateAccessToken, verifyAccessToken, generateRefreshToken, generateReferralCode };
