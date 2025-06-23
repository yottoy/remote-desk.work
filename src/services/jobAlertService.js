const cron = require('cron');
const { ObjectId } = require('mongodb');
const database = require('../utils/database');
const logger = require('../utils/logger');

class JobAlertService {
  constructor() {
    this.cronJobs = [];
    this.isInitialized = false;
  }

  /**
   * Initialize the job alert service
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Set up cron jobs for different frequencies
      this.setupCronJobs();
      this.isInitialized = true;
      logger.info('Job Alert Service initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize Job Alert Service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set up cron jobs for processing alerts
   */
  setupCronJobs() {
    // Immediate alerts - check every 5 minutes
    const immediateJob = new cron.CronJob('*/5 * * * *', () => {
      this.processAlerts('immediate').catch(error => {
        logger.error(`Immediate alerts processing failed: ${error.message}`);
      });
    });

    // Daily alerts - 8 AM every day
    const dailyJob = new cron.CronJob('0 8 * * *', () => {
      this.processAlerts('daily').catch(error => {
        logger.error(`Daily alerts processing failed: ${error.message}`);
      });
    });

    // Weekly alerts - Monday 8 AM
    const weeklyJob = new cron.CronJob('0 8 * * 1', () => {
      this.processAlerts('weekly').catch(error => {
        logger.error(`Weekly alerts processing failed: ${error.message}`);
      });
    });

    // Monthly alerts - 1st of month 8 AM
    const monthlyJob = new cron.CronJob('0 8 1 * *', () => {
      this.processAlerts('monthly').catch(error => {
        logger.error(`Monthly alerts processing failed: ${error.message}`);
      });
    });

    this.cronJobs = [immediateJob, dailyJob, weeklyJob, monthlyJob];

    // Start all cron jobs
    this.cronJobs.forEach(job => job.start());
    
    logger.info('Job alert cron jobs started');
  }

  /**
   * Process alerts for a specific frequency
   * @param {string} frequency - Alert frequency
   * @param {boolean} dryRun - Whether to perform a dry run
   * @returns {Object} Processing results
   */
  async processAlerts(frequency = 'all', dryRun = false) {
    try {
      if (!database.isConnected) {
        await database.connect();
      }

      const alertsCollection = database.db.collection('job_alert_subscriptions');

      // Build query for subscribers
      const query = {
        isActive: true,
        isVerified: true
      };

      if (frequency !== 'all') {
        query.frequency = frequency;
      }

      // Add time-based filtering for non-immediate alerts
      if (frequency !== 'immediate') {
        const now = new Date();
        let timeThreshold;

        switch (frequency) {
          case 'daily':
            timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'weekly':
            timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            timeThreshold = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour for immediate
        }

        query.$or = [
          { lastSent: null },
          { lastSent: { $lt: timeThreshold } }
        ];
      }

      const subscriptions = await alertsCollection.find(query).toArray();

      const results = {
        processed: 0,
        emailsSent: 0,
        errors: 0,
        skipped: 0,
        details: []
      };

      for (const subscription of subscriptions) {
        try {
          results.processed++;

          // Find matching jobs for this subscription
          const matchingJobs = await this.findMatchingJobs(subscription.preferences);

          if (matchingJobs.length === 0) {
            results.skipped++;
            results.details.push({
              email: subscription.email,
              status: 'skipped',
              reason: 'No matching jobs found'
            });
            continue;
          }

          // Filter out jobs already sent to this user
          const newJobs = await this.filterNewJobs(subscription._id, matchingJobs);

          if (newJobs.length === 0) {
            results.skipped++;
            results.details.push({
              email: subscription.email,
              status: 'skipped',
              reason: 'No new jobs since last alert'
            });
            continue;
          }

          if (!dryRun) {
            // Send email alert
            const emailService = require('./emailService');
            await emailService.sendJobAlertEmail(subscription, newJobs);

            // Update subscription
            await alertsCollection.updateOne(
              { _id: subscription._id },
              {
                $set: {
                  lastSent: new Date(),
                  updatedAt: new Date()
                },
                $inc: { totalEmailsSent: 1 }
              }
            );

            // Log sent jobs
            await this.logSentJobs(subscription._id, newJobs);
          }

          results.emailsSent++;
          results.details.push({
            email: subscription.email,
            status: 'sent',
            jobCount: newJobs.length
          });

        } catch (error) {
          results.errors++;
          results.details.push({
            email: subscription.email,
            status: 'error',
            error: error.message
          });
          logger.error(`Error processing alert for ${subscription.email}: ${error.message}`);
        }
      }

      logger.info(`Alert processing completed for ${frequency}: ${JSON.stringify(results)}`);
      return results;

    } catch (error) {
      logger.error(`Alert processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find jobs matching user preferences
   * @param {Object} preferences - User preferences
   * @returns {Array} Matching jobs
   */
  async findMatchingJobs(preferences) {
    try {
      if (!database.isConnected) {
        await database.connect();
      }

      const jobsCollection = database.db.collection('jobs');
      
      // Build query based on preferences
      const query = {};
      const andConditions = [];
      const orConditions = [];

      // Remote only filter
      if (preferences.remoteOnly) {
        query.isRemote = true;
      }

      // Salary range filter
      if (preferences.salaryRange && (preferences.salaryRange.min || preferences.salaryRange.max)) {
        const salaryConditions = {};
        if (preferences.salaryRange.min) {
          salaryConditions.$gte = preferences.salaryRange.min;
        }
        if (preferences.salaryRange.max) {
          salaryConditions.$lte = preferences.salaryRange.max;
        }
        query.salary = salaryConditions;
      }

      // Keywords matching
      if (preferences.keywords && preferences.keywords.length > 0) {
        const keywordRegex = preferences.keywords.map(keyword => new RegExp(keyword, 'i'));
        orConditions.push({
          $or: [
            { title: { $in: keywordRegex } },
            { description: { $in: keywordRegex } },
            { company: { $in: keywordRegex } }
          ]
        });
      }

      // Category matching
      if (preferences.categories && preferences.categories.length > 0) {
        query.category = { $in: preferences.categories };
      }

      // Experience level matching
      if (preferences.experienceLevel && preferences.experienceLevel.length > 0) {
        query.experienceLevel = { $in: preferences.experienceLevel };
      }

      // Exclude keywords
      if (preferences.excludeKeywords && preferences.excludeKeywords.length > 0) {
        const excludeRegex = preferences.excludeKeywords.map(keyword => new RegExp(keyword, 'i'));
        andConditions.push({
          $and: [
            { title: { $nin: excludeRegex } },
            { description: { $nin: excludeRegex } }
          ]
        });
      }

      // Combine conditions
      if (orConditions.length > 0) {
        andConditions.push({ $or: orConditions });
      }

      if (andConditions.length > 0) {
        query.$and = andConditions;
      }

      // Only get jobs from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };

      // Execute query
      const jobs = await jobsCollection.find(query)
        .sort({ createdAt: -1 })
        .limit(50) // Limit to 50 jobs per alert
        .toArray();

      return jobs;

    } catch (error) {
      logger.error(`Error finding matching jobs: ${error.message}`);
      return [];
    }
  }

  /**
   * Filter out jobs already sent to user
   * @param {ObjectId} subscriptionId - Subscription ID
   * @param {Array} jobs - Jobs to filter
   * @returns {Array} New jobs
   */
  async filterNewJobs(subscriptionId, jobs) {
    try {
      if (!database.isConnected) {
        await database.connect();
      }

      const sentJobsCollection = database.db.collection('job_alert_sent_jobs');

      // Get job IDs already sent to this user
      const sentJobs = await sentJobsCollection.find({
        subscriptionId: subscriptionId
      }).toArray();

      const sentJobIds = new Set(sentJobs.map(job => job.jobId.toString()));

      // Filter out already sent jobs
      const newJobs = jobs.filter(job => !sentJobIds.has(job._id.toString()));

      return newJobs;

    } catch (error) {
      logger.error(`Error filtering new jobs: ${error.message}`);
      return jobs; // Return all jobs if filtering fails
    }
  }

  /**
   * Log jobs sent to user
   * @param {ObjectId} subscriptionId - Subscription ID
   * @param {Array} jobs - Jobs sent
   */
  async logSentJobs(subscriptionId, jobs) {
    try {
      if (!database.isConnected) {
        await database.connect();
      }

      const sentJobsCollection = database.db.collection('job_alert_sent_jobs');
      const logsCollection = database.db.collection('job_alert_logs');

      // Log individual sent jobs
      const sentJobRecords = jobs.map(job => ({
        subscriptionId: subscriptionId,
        jobId: job._id,
        sentAt: new Date(),
        jobTitle: job.title,
        jobCompany: job.company
      }));

      if (sentJobRecords.length > 0) {
        await sentJobsCollection.insertMany(sentJobRecords);
      }

      // Log the email sending event
      await logsCollection.insertOne({
        type: 'email_sent',
        subscriptionId: subscriptionId,
        jobCount: jobs.length,
        timestamp: new Date()
      });

    } catch (error) {
      logger.error(`Error logging sent jobs: ${error.message}`);
    }
  }

  /**
   * Get job alert statistics
   * @returns {Object} Statistics
   */
  async getStatistics() {
    try {
      if (!database.isConnected) {
        await database.connect();
      }

      const alertsCollection = database.db.collection('job_alert_subscriptions');
      const logsCollection = database.db.collection('job_alert_logs');

      const stats = await alertsCollection.aggregate([
        {
          $group: {
            _id: null,
            totalSubscriptions: { $sum: 1 },
            activeSubscriptions: { $sum: { $cond: ['$isActive', 1, 0] } },
            verifiedSubscriptions: { $sum: { $cond: ['$isVerified', 1, 0] } },
            totalEmailsSent: { $sum: '$totalEmailsSent' }
          }
        }
      ]).toArray();

      const recentLogs = await logsCollection.find({
        type: 'email_sent',
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).count();

      return {
        ...stats[0],
        emailsLastWeek: recentLogs
      };

    } catch (error) {
      logger.error(`Error getting statistics: ${error.message}`);
      return {};
    }
  }

  /**
   * Stop all cron jobs
   */
  stop() {
    this.cronJobs.forEach(job => {
      if (job.running) {
        job.stop();
      }
    });
    this.cronJobs = [];
    this.isInitialized = false;
    logger.info('Job Alert Service stopped');
  }
}

// Export singleton instance
module.exports = new JobAlertService(); 