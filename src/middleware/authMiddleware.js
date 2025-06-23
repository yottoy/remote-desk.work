const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const database = require('../utils/database');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded token or null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.error(`Token verification failed: ${error.message}`);
    return null;
  }
}

/**
 * Middleware to require authentication
 */
async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No valid authentication token provided'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided authentication token is invalid or expired'
      });
    }

    // Get user from database
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'The user associated with this token no longer exists'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Authentication middleware error: ${error.message}`);
    res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
}

/**
 * Middleware for optional authentication
 */
async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await getUserById(decoded.userId);
        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error(`Optional auth middleware error: ${error.message}`);
    // Continue without authentication for optional auth
    next();
  }
}

/**
 * Middleware to require specific role
 * @param {string|Array} roles - Required role(s)
 */
function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be authenticated to access this resource'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

/**
 * Middleware to require admin role
 */
function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

/**
 * Middleware to require editor or admin role
 */
function requireEditor(req, res, next) {
  return requireRole(['admin', 'editor'])(req, res, next);
}

/**
 * Extract token from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} - Token or null
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

/**
 * Get user by ID from database
 * @param {string} userId - User ID
 * @returns {Object|null} - User object or null
 */
async function getUserById(userId) {
  try {
    if (!database.isConnected) {
      await database.connect();
    }

    const usersCollection = database.db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    return user;
  } catch (error) {
    logger.error(`Error fetching user: ${error.message}`);
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken,
  requireAuth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireEditor,
  extractToken,
  getUserById
}; 