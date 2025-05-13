const mongoose = require('mongoose');
const Job = require('../models/Job');
const config = require('../../config/config');
const logger = require('./logger');

// In-memory storage as fallback
let inMemoryJobs = [];
let useInMemory = false;

// Connect to MongoDB
async function connect() {
  try {
    logger.info('Connecting to MongoDB...');
    
    // Try to connect with timeout to prevent long waiting
    const connectPromise = mongoose.connect(config.mongodb.uri, config.mongodb.options);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    logger.info('Successfully connected to MongoDB');
    useInMemory = false;
    return mongoose.connection;
  } catch (error) {
    logger.warn(`MongoDB connection failed: ${error.message}`);
    logger.warn('Falling back to in-memory storage mode');
    useInMemory = true;
    return null;
  }
}

// Check if connected to MongoDB
function isConnected() {
  return !useInMemory && mongoose.connection && mongoose.connection.readyState === 1;
}

// Close MongoDB connection
async function disconnect() {
  if (!useInMemory) {
    try {
      logger.info('Closing MongoDB connection...');
      await mongoose.disconnect();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error(`Error closing MongoDB connection: ${error.message}`);
    }
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

    if (useInMemory) {
      // In-memory implementation
      const existingIndex = inMemoryJobs.findIndex(job => job.uniqueIdentifier === uniqueIdentifier);
      if (existingIndex >= 0) {
        inMemoryJobs[existingIndex] = { ...inMemoryJobs[existingIndex], ...updateData };
        logger.debug(`Job updated in memory: ${updateData.title} by ${updateData.company}`);
        return inMemoryJobs[existingIndex];
      } else {
        const newJob = { ...updateData, _id: Math.random().toString(36).substring(2, 15) };
        inMemoryJobs.push(newJob);
        logger.debug(`Job saved to memory: ${newJob.title} by ${newJob.company}`);
        return newJob;
      }
    } else {
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
    }
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
    
    if (useInMemory) {
      // In-memory implementation
      let inserted = 0;
      let updated = 0;
      
      jobsData.forEach(job => {
        // Create uniqueIdentifier for deduplication
        const normalizedTitle = job.title.toLowerCase().trim();
        const normalizedCompany = job.company.toLowerCase().trim();
        const uniqueIdentifier = `${normalizedCompany}-${normalizedTitle}`;

        // Set expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + config.database.ttlDays);

        // Prepare the job data
        const jobData = {
          ...job,
          uniqueIdentifier,
          expiresAt,
          scrapedDate: new Date(),
          featured: job.qualityScore >= config.qualityScoring.featuredThreshold
        };

        const existingIndex = inMemoryJobs.findIndex(j => j.uniqueIdentifier === uniqueIdentifier);
        if (existingIndex >= 0) {
          inMemoryJobs[existingIndex] = { ...inMemoryJobs[existingIndex], ...jobData };
          updated++;
        } else {
          const newJob = { ...jobData, _id: Math.random().toString(36).substring(2, 15) };
          inMemoryJobs.push(newJob);
          inserted++;
        }
      });
      
      logger.info(`Bulk save result in memory: ${inserted} inserted, ${updated} updated`);
      return {
        inserted,
        updated,
        failed: 0
      };
    } else {
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
    }
  } catch (error) {
    logger.error(`Error in bulk save: ${error.message}`);
    throw error;
  }
}

// Get all jobs with optional filtering
async function getJobs(filter = {}, limit = 100, skip = 0, sort = { scrapedDate: -1 }) {
  try {
    if (useInMemory) {
      // Simple in-memory filtering implementation
      let result = [...inMemoryJobs];
      
      // Apply sorting by scrapedDate (newest first by default)
      result.sort((a, b) => {
        if (sort.scrapedDate === -1) {
          return new Date(b.scrapedDate) - new Date(a.scrapedDate);
        } else {
          return new Date(a.scrapedDate) - new Date(b.scrapedDate);
        }
      });
      
      // Apply pagination
      return result.slice(skip, skip + limit);
    } else {
      const jobs = await Job.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      return jobs;
    }
  } catch (error) {
    logger.error(`Error getting jobs: ${error.message}`);
    throw error;
  }
}

// Get job statistics
async function getStats() {
  try {
    if (useInMemory) {
      // In-memory stats calculation
      const totalJobs = inMemoryJobs.length;
      const featuredJobs = inMemoryJobs.filter(job => job.featured).length;
      
      // Group by source
      const sourceMap = {};
      inMemoryJobs.forEach(job => {
        if (!sourceMap[job.source]) sourceMap[job.source] = 0;
        sourceMap[job.source]++;
      });
      
      const sourceStats = Object.entries(sourceMap).map(([source, count]) => ({
        _id: source,
        count
      }));
      
      // Check for new jobs in the last day
      const lastDay = new Date();
      lastDay.setDate(lastDay.getDate() - 1);
      const newJobsLastDay = inMemoryJobs.filter(
        job => new Date(job.createdAt) >= lastDay
      ).length;
      
      return {
        totalJobs,
        featuredJobs,
        sourceStats,
        newJobsLastDay
      };
    } else {
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
    }
  } catch (error) {
    logger.error(`Error getting stats: ${error.message}`);
    throw error;
  }
}

// Clear in-memory data (for testing)
function clearMemoryData() {
  if (useInMemory) {
    inMemoryJobs = [];
    logger.debug('In-memory job data cleared');
  }
}

module.exports = {
  connect,
  disconnect,
  isConnected,
  saveJob,
  bulkSaveJobs,
  getJobs,
  getStats,
  clearMemoryData
}; 