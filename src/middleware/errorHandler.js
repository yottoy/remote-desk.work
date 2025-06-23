const logger = require('../utils/logger');

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error(`Error in ${req.method} ${req.path}: ${err.message}`);
  logger.error(err.stack);

  // Default error response
  let status = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
    details = err.details || err.message;
  } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    status = 500;
    message = 'Database Error';
    if (err.code === 11000) {
      status = 409;
      message = 'Duplicate Entry';
      details = 'A record with this information already exists';
    }
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid Token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token Expired';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID Format';
  } else if (err.statusCode || err.status) {
    status = err.statusCode || err.status;
    message = err.message;
  }

  // Don't expose sensitive information in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    error: message,
    status,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Add details in development or for client errors
  if (isDevelopment || status < 500) {
    if (details) {
      errorResponse.details = details;
    }
    if (isDevelopment) {
      errorResponse.stack = err.stack;
    }
  }

  res.status(status).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async route handler
 * @returns {Function} - Wrapped route handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create a validation error
 * @param {string} message - Error message
 * @param {Object} details - Validation details
 * @returns {Error} - Validation error
 */
function createValidationError(message, details) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.details = details;
  return error;
}

/**
 * Create a not found error
 * @param {string} resource - Resource name
 * @returns {Error} - Not found error
 */
function createNotFoundError(resource = 'Resource') {
  const error = new Error(`${resource} not found`);
  error.statusCode = 404;
  return error;
}

/**
 * Create a forbidden error
 * @param {string} message - Error message
 * @returns {Error} - Forbidden error
 */
function createForbiddenError(message = 'Access forbidden') {
  const error = new Error(message);
  error.statusCode = 403;
  return error;
}

/**
 * Create a bad request error
 * @param {string} message - Error message
 * @returns {Error} - Bad request error
 */
function createBadRequestError(message = 'Bad request') {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

module.exports = {
  errorHandler,
  asyncHandler,
  createValidationError,
  createNotFoundError,
  createForbiddenError,
  createBadRequestError
}; 