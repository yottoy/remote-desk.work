const express = require('express');
const validator = require('validator');
const { ObjectId } = require('mongodb');
const database = require('../utils/database');
const authMiddleware = require('../middleware/authMiddleware');
const { asyncHandler, createValidationError, createNotFoundError, createBadRequestError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Alert frequencies
const ALERT_FREQUENCIES = {
  IMMEDIATE: 'immediate',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

// Job categories based on content analysis
const JOB_CATEGORIES = {
  EXECUTIVE_ADMIN: 'executive_admin',
  OPERATIONS: 'operations',
  PROJECT_ADMIN: 'project_admin',
  DATA_ENTRY: 'data_entry',
  CUSTOMER_SUCCESS: 'customer_success',
  GENERAL_ADMIN: 'general_admin'
};

/**
 * POST /api/job-alerts/subscribe
 * Subscribe to job alerts (public endpoint)
 */
router.post('/subscribe', asyncHandler(async (req, res) => {
  const {
    email,
    firstName,
    lastName,
    preferences = {},
    frequency = ALERT_FREQUENCIES.WEEKLY
  } = req.body;

  // Validation
  const errors = [];
  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required');
  }
  if (!firstName || firstName.trim().length === 0) {
    errors.push('First name is required');
  }
  if (!Object.values(ALERT_FREQUENCIES).includes(frequency)) {
    errors.push('Valid frequency is required');
  }

  if (errors.length > 0) {
    throw createValidationError('Subscription validation failed', errors);
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const alertsCollection = database.db.collection('job_alert_subscriptions');

  // Check if email already exists
  const existingSubscription = await alertsCollection.findOne({ email: email.toLowerCase() });
  if (existingSubscription) {
    // Update existing subscription
    const updateResult = await alertsCollection.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          firstName: firstName.trim(),
          lastName: lastName ? lastName.trim() : null,
          preferences,
          frequency,
          isActive: true,
          updatedAt: new Date()
        }
      }
    );

    logger.info(`Job alert subscription updated: ${email}`);

    return res.json({
      message: 'Subscription updated successfully',
      subscriptionId: existingSubscription._id
    });
  }

  // Create new subscription
  const subscription = {
    email: email.toLowerCase(),
    firstName: firstName.trim(),
    lastName: lastName ? lastName.trim() : null,
    preferences: {
      categories: preferences.categories || [],
      keywords: preferences.keywords || [],
      salaryRange: preferences.salaryRange || { min: null, max: null },
      experienceLevel: preferences.experienceLevel || [],
      remoteOnly: preferences.remoteOnly !== false, // Default to true
      excludeKeywords: preferences.excludeKeywords || []
    },
    frequency,
    isActive: true,
    lastSent: null,
    totalEmailsSent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    verificationToken: generateVerificationToken(),
    isVerified: false
  };

  const result = await alertsCollection.insertOne(subscription);

  // Send verification email
  try {
    const emailService = require('../services/emailService');
    await emailService.sendVerificationEmail(subscription);
  } catch (error) {
    logger.error(`Failed to send verification email: ${error.message}`);
  }

  logger.info(`New job alert subscription created: ${email}`);

  res.status(201).json({
    message: 'Subscription created successfully. Please check your email to verify your subscription.',
    subscriptionId: result.insertedId
  });
}));

/**
 * GET /api/job-alerts/verify/:token
 * Verify email subscription
 */
router.get('/verify/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!database.isConnected) {
    await database.connect();
  }

  const alertsCollection = database.db.collection('job_alert_subscriptions');
  const subscription = await alertsCollection.findOne({ verificationToken: token });

  if (!subscription) {
    throw createNotFoundError('Verification token');
  }

  // Update subscription as verified
  await alertsCollection.updateOne(
    { _id: subscription._id },
    {
      $set: {
        isVerified: true,
        verificationToken: null,
        updatedAt: new Date()
      }
    }
  );

  logger.info(`Job alert subscription verified: ${subscription.email}`);

  res.json({
    message: 'Email verified successfully. You will now receive job alerts based on your preferences.'
  });
}));

/**
 * GET /api/job-alerts/preferences/:subscriptionId
 * Get subscription preferences
 */
router.get('/preferences/:subscriptionId', asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  if (!ObjectId.isValid(subscriptionId)) {
    throw createBadRequestError('Invalid subscription ID');
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const alertsCollection = database.db.collection('job_alert_subscriptions');
  const subscription = await alertsCollection.findOne(
    { _id: new ObjectId(subscriptionId) },
    { projection: { verificationToken: 0 } }
  );

  if (!subscription) {
    throw createNotFoundError('Subscription');
  }

  res.json({
    subscription
  });
}));

/**
 * PUT /api/job-alerts/preferences/:subscriptionId
 * Update subscription preferences
 */
router.put('/preferences/:subscriptionId', asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;
  const { preferences, frequency, firstName, lastName } = req.body;

  if (!ObjectId.isValid(subscriptionId)) {
    throw createBadRequestError('Invalid subscription ID');
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const alertsCollection = database.db.collection('job_alert_subscriptions');
  const subscription = await alertsCollection.findOne({ _id: new ObjectId(subscriptionId) });

  if (!subscription) {
    throw createNotFoundError('Subscription');
  }

  // Build update object
  const updateFields = {
    updatedAt: new Date()
  };

  if (preferences) {
    updateFields.preferences = {
      categories: preferences.categories || subscription.preferences.categories,
      keywords: preferences.keywords || subscription.preferences.keywords,
      salaryRange: preferences.salaryRange || subscription.preferences.salaryRange,
      experienceLevel: preferences.experienceLevel || subscription.preferences.experienceLevel,
      remoteOnly: preferences.remoteOnly !== undefined ? preferences.remoteOnly : subscription.preferences.remoteOnly,
      excludeKeywords: preferences.excludeKeywords || subscription.preferences.excludeKeywords
    };
  }

  if (frequency && Object.values(ALERT_FREQUENCIES).includes(frequency)) {
    updateFields.frequency = frequency;
  }

  if (firstName) updateFields.firstName = firstName.trim();
  if (lastName) updateFields.lastName = lastName.trim();

  await alertsCollection.updateOne(
    { _id: new ObjectId(subscriptionId) },
    { $set: updateFields }
  );

  logger.info(`Job alert preferences updated: ${subscriptionId}`);

  res.json({
    message: 'Preferences updated successfully'
  });
}));

/**
 * POST /api/job-alerts/unsubscribe
 * Unsubscribe from job alerts
 */
router.post('/unsubscribe', asyncHandler(async (req, res) => {
  const { email, subscriptionId } = req.body;

  if (!email && !subscriptionId) {
    throw createBadRequestError('Email or subscription ID is required');
  }

  if (!database.isConnected) {
    await database.connect();
  }

  const alertsCollection = database.db.collection('job_alert_subscriptions');

  let query = {};
  if (subscriptionId && ObjectId.isValid(subscriptionId)) {
    query._id = new ObjectId(subscriptionId);
  } else if (email) {
    query.email = email.toLowerCase();
  } else {
    throw createBadRequestError('Valid email or subscription ID is required');
  }

  const result = await alertsCollection.updateOne(
    query,
    {
      $set: {
        isActive: false,
        updatedAt: new Date()
      }
    }
  );

  if (result.matchedCount === 0) {
    throw createNotFoundError('Subscription');
  }

  logger.info(`Job alert unsubscribed: ${email || subscriptionId}`);

  res.json({
    message: 'Successfully unsubscribed from job alerts'
  });
}));

/**
 * GET /api/job-alerts/admin/subscriptions
 * Get all subscriptions (admin only)
 */
router.get('/admin/subscriptions', authMiddleware.requireAdmin, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    status = 'all',
    search,
    frequency
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  if (!database.isConnected) {
    await database.connect();
  }

  const alertsCollection = database.db.collection('job_alert_subscriptions');

  // Build query
  const query = {};
  
  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  if (frequency && Object.values(ALERT_FREQUENCIES).includes(frequency)) {
    query.frequency = frequency;
  }

  if (search) {
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } }
    ];
  }

  // Get subscriptions
  const subscriptions = await alertsCollection
    .find(query, { projection: { verificationToken: 0 } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .toArray();

  // Get total count
  const total = await alertsCollection.countDocuments(query);

  // Get summary statistics
  const stats = await alertsCollection.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: ['$isActive', 1, 0] } },
        verified: { $sum: { $cond: ['$isVerified', 1, 0] } }
      }
    }
  ]).toArray();

  res.json({
    subscriptions,
    pagination: {
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum),
      total
    },
    stats: stats.length > 0 ? stats[0] : null
  });
}));

/**
 * POST /api/job-alerts/admin/process-alerts
 * Manually trigger alert processing (admin only)
 */
router.post('/admin/process-alerts', authMiddleware.requireAdmin, asyncHandler(async (req, res) => {
  const { frequency = 'all', dryRun = false } = req.body;

  try {
    const jobAlertService = require('../services/jobAlertService');
    const result = await jobAlertService.processAlerts(frequency, dryRun);

    logger.info(`Alert processing completed: ${JSON.stringify(result)}`);

    res.json({
      message: 'Alert processing completed',
      result
    });
  } catch (error) {
    logger.error(`Alert processing failed: ${error.message}`);
    throw createBadRequestError(`Alert processing failed: ${error.message}`);
  }
}));

/**
 * Helper function to generate verification token
 */
function generateVerificationToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

module.exports = router; 