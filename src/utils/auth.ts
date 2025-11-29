/**
 * Authentication utilities (JWT)
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'tailor' | 'customer';
}

/**
 * Generate JWT token
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Extract token from Authorization header
 */
export const extractToken = (authHeader: string | null | undefined): string | null => {
  if (!authHeader) {
    return null;
  }
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  return null;
};

/**
 * Middleware to verify authentication (for API routes)
 */
export const requireAuth = (req: any): JWTPayload => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = extractToken(authHeader);

  if (!token) {
    throw new Error('Authentication required');
  }

  return verifyToken(token);
};

/**
 * Middleware to require specific role
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: any): JWTPayload => {
    const user = requireAuth(req);
    if (!allowedRoles.includes(user.role)) {
      throw new Error('Insufficient permissions');
    }
    return user;
  };
};

