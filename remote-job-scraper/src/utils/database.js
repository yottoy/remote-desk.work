const mongoose = require('mongoose');
const Job = require('../models/Job');
const config = require('../../config/config');
const logger = require('./logger');

// Connect to MongoDB
async function connect() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('Successfully connected to MongoDB');
    return mongoose.connection;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
}

// Close MongoDB connection
async function disconnect() {
  try {
    logger.info('Closing MongoDB connection...');
    await mongoose.disconnect();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
    throw error;
  }
}

// Save a job to the database with upsert logic
async function saveJob(jobData) {
  try {
    // Create uniqueIdentifier for deduplication
    const normalizedTitle = jobData.title.toLowerCase().trim();
    const normalizedCompany = jobData.company.toLowerCase().trim();
    const uniqueIdentifier = `${normalizedCompany}-${normalizedTitle}`;

    // Set expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.database.ttlDays);

    // Prepare update data
    const updateData = {
      ...jobData,
      uniqueIdentifier,
      expiresAt,
      scrapedDate: new Date(),
      featured: jobData.qualityScore >= config.qualityScoring.featuredThreshold
    };

    // Use findOneAndUpdate with upsert option for efficient updates
    const result = await Job.findOneAndUpdate(
      { uniqueIdentifier },
      updateData,
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    logger.debug(`Job saved/updated: ${result.title} by ${result.company}`);
    return result;
  } catch (error) {
    logger.error(`Error saving job: ${error.message}`);
    throw error;
  }
}

// Bulk save jobs with upsert logic
async function bulkSaveJobs(jobsData) {
  try {
    if (!jobsData || jobsData.length === 0) {
      logger.warn('No jobs to save');
      return { inserted: 0, updated: 0, failed: 0 };
    }

    logger.info(`Bulk saving ${jobsData.length} jobs`);
    
    const operations = jobsData.map(job => {
      // Create uniqueIdentifier for deduplication
      const normalizedTitle = job.title.toLowerCase().trim();
      const normalizedCompany = job.company.toLowerCase().trim();
      const uniqueIdentifier = `${normalizedCompany}-${normalizedTitle}`;

      // Set expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + config.database.ttlDays);

      // Prepare the job data with all necessary fields
      const jobData = {
        ...job,
        uniqueIdentifier,
        expiresAt,
        scrapedDate: new Date(),
        featured: job.qualityScore >= config.qualityScoring.featuredThreshold
      };

      return {
        updateOne: {
          filter: { uniqueIdentifier },
          update: { $set: jobData },
          upsert: true
        }
      };
    });

    const result = await Job.bulkWrite(operations);
    
    logger.info(`Bulk save result: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
    return {
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      failed: jobsData.length - (result.upsertedCount + result.modifiedCount)
    };
  } catch (error) {
    logger.error(`Error in bulk save: ${error.message}`);
    throw error;
  }
}

// Get all jobs with optional filtering
async function getJobs(filter = {}, limit = 100, skip = 0, sort = { scrapedDate: -1 }) {
  try {
    const jobs = await Job.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    return jobs;
  } catch (error) {
    logger.error(`Error getting jobs: ${error.message}`);
    throw error;
  }
}

// Get job statistics
async function getStats() {
  try {
    const totalJobs = await Job.countDocuments();
    const featuredJobs = await Job.countDocuments({ featured: true });
    const sourceStats = await Job.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    
    const lastDay = new Date();
    lastDay.setDate(lastDay.getDate() - 1);
    const newJobsLastDay = await Job.countDocuments({ createdAt: { $gte: lastDay } });
    
    return {
      totalJobs,
      featuredJobs,
      sourceStats,
      newJobsLastDay
    };
  } catch (error) {
    logger.error(`Error getting stats: ${error.message}`);
    throw error;
  }
}

module.exports = {
  connect,
  disconnect,
  saveJob,
  bulkSaveJobs,
  getJobs,
  getStats
}; 