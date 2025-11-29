/**
 * Authentication utilities (JWT) - JavaScript version for API routes
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

const extractToken = (authHeader) => {
  if (!authHeader) {
    return null;
  }
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
};

const requireAuth = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = extractToken(authHeader);

  if (!token) {
    throw new Error('Authentication required');
  }

  return verifyToken(token);
};

const requireRole = (allowedRoles) => {
  return (req) => {
    const user = requireAuth(req);
    if (!allowedRoles.includes(user.role)) {
      throw new Error('Insufficient permissions');
    }
    return user;
  };
};

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
  requireAuth,
  requireRole,
};

