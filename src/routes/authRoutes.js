const express = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { ObjectId } = require('mongodb');
const database = require('../utils/database');
const authMiddleware = require('../middleware/authMiddleware');
const { asyncHandler, createValidationError, createNotFoundError, createBadRequestError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, role = 'author' } = req.body;

  // Validation
  const errors = [];
  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required');
  }
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (!firstName || firstName.trim().length === 0) {
    errors.push('First name is required');
  }
  if (!lastName || lastName.trim().length === 0) {
    errors.push('Last name is required');
  }
  if (!['admin', 'editor', 'author'].includes(role)) {
    errors.push('Invalid role specified');
  }

  if (errors.length > 0) {
    throw createValidationError('Registration validation failed', errors);
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const usersCollection = database.db.collection('users');

  // Check if user already exists
  const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw createBadRequestError('User with this email already exists');
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user object
  const newUser = {
    email: email.toLowerCase(),
    password: hashedPassword,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    role,
    isActive: true,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null,
    loginCount: 0
  };

  // Insert user
  const result = await usersCollection.insertOne(newUser);
  const user = await usersCollection.findOne({ _id: result.insertedId });

  // Remove password from response
  const { password: _, ...userResponse } = user;

  // Generate token
  const token = authMiddleware.generateToken(user);

  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    message: 'User registered successfully',
    user: userResponse,
    token
  });
}));

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw createValidationError('Email and password are required');
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const usersCollection = database.db.collection('users');

  // Find user
  const user = await usersCollection.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw createBadRequestError('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw createBadRequestError('Account is deactivated');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createBadRequestError('Invalid email or password');
  }

  // Update login statistics
  await usersCollection.updateOne(
    { _id: user._id },
    { 
      $set: { lastLogin: new Date(), updatedAt: new Date() },
      $inc: { loginCount: 1 }
    }
  );

  // Remove password from response
  const { password: _, ...userResponse } = user;

  // Generate token
  const token = authMiddleware.generateToken(user);

  logger.info(`User logged in: ${email}`);

  res.json({
    message: 'Login successful',
    user: userResponse,
    token
  });
}));

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authMiddleware.requireAuth, asyncHandler(async (req, res) => {
  const { password, ...userProfile } = req.user;
  
  res.json({
    user: userProfile
  });
}));

/**
 * PUT /api/auth/profile
 * Update current user profile
 */
router.put('/profile', authMiddleware.requireAuth, asyncHandler(async (req, res) => {
  const { firstName, lastName, email } = req.body;
  const userId = req.user._id;

  // Validation
  const errors = [];
  if (email && !validator.isEmail(email)) {
    errors.push('Valid email is required');
  }
  if (firstName && firstName.trim().length === 0) {
    errors.push('First name cannot be empty');
  }
  if (lastName && lastName.trim().length === 0) {
    errors.push('Last name cannot be empty');
  }

  if (errors.length > 0) {
    throw createValidationError('Profile update validation failed', errors);
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const usersCollection = database.db.collection('users');

  // Check if email is already taken by another user
  if (email && email.toLowerCase() !== req.user.email) {
    const existingUser = await usersCollection.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: new ObjectId(userId) }
    });
    if (existingUser) {
      throw createBadRequestError('Email is already taken');
    }
  }

  // Build update object
  const updateFields = {
    updatedAt: new Date()
  };

  if (firstName) updateFields.firstName = firstName.trim();
  if (lastName) updateFields.lastName = lastName.trim();
  if (email) updateFields.email = email.toLowerCase();

  // Update user
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $set: updateFields }
  );

  // Get updated user
  const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
  const { password, ...userResponse } = updatedUser;

  res.json({
    message: 'Profile updated successfully',
    user: userResponse
  });
}));

/**
 * PUT /api/auth/change-password
 * Change user password
 */
router.put('/change-password', authMiddleware.requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  // Validation
  if (!currentPassword || !newPassword) {
    throw createValidationError('Current password and new password are required');
  }
  if (newPassword.length < 6) {
    throw createValidationError('New password must be at least 6 characters');
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const usersCollection = database.db.collection('users');

  // Get current user
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    throw createNotFoundError('User');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw createBadRequestError('Current password is incorrect');
  }

  // Hash new password
  const saltRounds = 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    }
  );

  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    message: 'Password changed successfully'
  });
}));

/**
 * GET /api/auth/users
 * Get all users (admin only)
 */
router.get('/users', authMiddleware.requireAdmin, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  if (!database.isConnected) {
    await database.connect();
  }

  const usersCollection = database.db.collection('users');

  // Build query
  const query = {};
  if (role && ['admin', 'editor', 'author'].includes(role)) {
    query.role = role;
  }
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Get users (excluding passwords)
  const users = await usersCollection
    .find(query, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .toArray();

  // Get total count
  const total = await usersCollection.countDocuments(query);

  res.json({
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      total
    }
  });
}));

/**
 * PUT /api/auth/users/:userId/role
 * Update user role (admin only)
 */
router.put('/users/:userId/role', authMiddleware.requireAdmin, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  // Validation
  if (!['admin', 'editor', 'author'].includes(role)) {
    throw createValidationError('Invalid role specified');
  }

  if (!ObjectId.isValid(userId)) {
    throw createBadRequestError('Invalid user ID');
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const usersCollection = database.db.collection('users');

  // Update user role
  const result = await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        role,
        updatedAt: new Date()
      }
    }
  );

  if (result.matchedCount === 0) {
    throw createNotFoundError('User');
  }

  logger.info(`User role updated: ${userId} -> ${role}`);

  res.json({
    message: 'User role updated successfully'
  });
}));

/**
 * PUT /api/auth/users/:userId/status
 * Activate/deactivate user (admin only)
 */
router.put('/users/:userId/status', authMiddleware.requireAdmin, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { isActive } = req.body;

  // Validation
  if (typeof isActive !== 'boolean') {
    throw createValidationError('isActive must be a boolean value');
  }

  if (!ObjectId.isValid(userId)) {
    throw createBadRequestError('Invalid user ID');
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const usersCollection = database.db.collection('users');

  // Update user status
  const result = await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        isActive,
        updatedAt: new Date()
      }
    }
  );

  if (result.matchedCount === 0) {
    throw createNotFoundError('User');
  }

  logger.info(`User status updated: ${userId} -> ${isActive ? 'active' : 'inactive'}`);

  res.json({
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
  });
}));

module.exports = router; 