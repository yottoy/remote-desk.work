const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');

/**
 * MongoDB integration for saving scraped jobs directly to the database
 */
class MongoDBIntegration {
  constructor(config = {}) {
    this.connectionString = config.connectionString || process.env.MONGODB_URI;
    this.databaseName = config.databaseName || 'clickclickjob';
    this.collectionName = config.collectionName || 'jobs';
    this.client = null;
    this.db = null;
    this.collection = null;
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      if (this.isConnected) {
        return true;
      }

      logger.info('🔌 Connecting to MongoDB...');
      
      this.client = new MongoClient(this.connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db(this.databaseName);
      this.collection = this.db.collection(this.collectionName);
      this.isConnected = true;

      logger.info('✅ MongoDB connected successfully');
      logger.info(`📊 Database: ${this.databaseName}, Collection: ${this.collectionName}`);
      
      return true;
      
    } catch (error) {
      logger.error(`❌ MongoDB connection failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.close();
        this.isConnected = false;
        logger.info('🔌 MongoDB disconnected');
      }
    } catch (error) {
      logger.error(`❌ MongoDB disconnect error: ${error.message}`);
    }
  }

  /**
   * Transform scraped job to match your database schema
   */
  transformJob(job, source) {
    const now = new Date();
    
    return {
      // Core job fields
      title: job.title,
      company: job.company,
      description: job.description || job.descriptionText || '',
      location: job.location || 'Remote',
      salary: job.salary || '',
      url: job.url,
      
      // Categorization
      source: source,
      jobCategory: this.categorizeJob(job),
      jobType: this.detectJobType(job),
      experienceLevel: this.detectExperienceLevel(job),
      
      // Dates - preserve original posting date if available
      postedDate: job.postedDate ? new Date(job.postedDate) : now,
      scrapedAt: now,
      
      // Quality and credibility
      credibilityScore: job.credibilityScore || 7,
      
      // Remote work indicator - REQUIRED for frontend API
      remote: true,
      isRemote: true, // Additional field for backwards compatibility
      
      // Experimental scraper metadata
      experimentalScraper: true,
      
      // Ensure required fields for your frontend
      _id: undefined, // Let MongoDB generate
      createdAt: now,
      updatedAt: now,
      
      // Status fields
      isActive: true,
      isApproved: true, // Auto-approve experimental scraper jobs
      
      // Additional metadata
      metadata: {
        originalData: job,
        processingVersion: '1.0',
        qualityChecks: {
          hasTitle: !!job.title,
          hasCompany: !!job.company,
          hasDescription: !!(job.description || job.descriptionText),
          hasUrl: !!job.url,
          hasSalary: !!job.salary
        }
      }
    };
  }

  /**
   * Detect job type from job data
   */
  detectJobType(job) {
    const title = (job.title || '').toLowerCase();
    const description = (job.description || job.descriptionText || '').toLowerCase();
    
    if (title.includes('part time') || description.includes('part time')) {
      return 'part-time';
    } else if (title.includes('contract') || title.includes('freelance') || description.includes('contract')) {
      return 'contract';
    } else if (title.includes('intern') || description.includes('intern')) {
      return 'internship';
    } else {
      return 'full-time';
    }
  }

  /**
   * Categorize job based on title and description
   */
  categorizeJob(job) {
    const title = (job.title || '').toLowerCase();
    const description = (job.description || job.descriptionText || '').toLowerCase();
    const combined = `${title} ${description}`;
    
    if (combined.includes('virtual assistant') || combined.includes('va ')) {
      return 'virtual-assistant';
    } else if (combined.includes('data entry')) {
      return 'data-entry';
    } else if (combined.includes('customer service') || combined.includes('support')) {
      return 'customer-service';
    } else if (combined.includes('marketing') || combined.includes('social media')) {
      return 'marketing';
    } else if (combined.includes('writer') || combined.includes('content')) {
      return 'content-writing';
    } else if (combined.includes('design') || combined.includes('graphic')) {
      return 'design';
    } else if (combined.includes('admin') || combined.includes('assistant')) {
      return 'administrative';
    } else if (combined.includes('developer') || combined.includes('programming')) {
      return 'development';
    } else {
      return 'other';
    }
  }

  /**
   * Detect experience level
   */
  detectExperienceLevel(job) {
    const title = (job.title || '').toLowerCase();
    const description = (job.description || job.descriptionText || '').toLowerCase();
    const combined = `${title} ${description}`;
    
    if (combined.includes('senior') || combined.includes('lead') || combined.includes('manager')) {
      return 'senior';
    } else if (combined.includes('junior') || combined.includes('entry') || combined.includes('beginner')) {
      return 'junior';
    } else {
      return 'mid';
    }
  }

  /**
   * Save jobs to MongoDB with duplicate checking
   */
  async saveJobs(jobs, source = 'experimental-scrapers') {
    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) {
          throw new Error('Failed to connect to MongoDB');
        }
      }

      if (!jobs || jobs.length === 0) {
        logger.info('📊 No jobs to save');
        return { saved: 0, duplicates: 0, errors: 0 };
      }

      logger.info(`💾 Saving ${jobs.length} jobs to MongoDB...`);

      const results = {
        saved: 0,
        duplicates: 0,
        errors: 0,
        details: []
      };

      for (const job of jobs) {
        try {
          const transformedJob = this.transformJob(job, source);
          
          // Check for duplicates based on URL or title+company
          const duplicateQuery = {
            $or: [
              { url: transformedJob.url },
              { 
                title: transformedJob.title,
                company: transformedJob.company,
                source: transformedJob.source
              }
            ].filter(condition => {
              // Only include URL condition if URL exists
              if (condition.url) return !!condition.url;
              return true;
            })
          };

          const existingJob = await this.collection.findOne(duplicateQuery);
          
          if (existingJob) {
            results.duplicates++;
            logger.debug(`Duplicate job found: ${transformedJob.title} at ${transformedJob.company}`);
          } else {
            // Insert new job
            const insertResult = await this.collection.insertOne(transformedJob);
            
            if (insertResult.acknowledged) {
              results.saved++;
              results.details.push({
                id: insertResult.insertedId,
                title: transformedJob.title,
                company: transformedJob.company,
                source: transformedJob.source
              });
              logger.debug(`Saved job: ${transformedJob.title} at ${transformedJob.company}`);
            } else {
              results.errors++;
              logger.warn(`Failed to save job: ${transformedJob.title} at ${transformedJob.company}`);
            }
          }
          
        } catch (error) {
          results.errors++;
          logger.error(`Error saving individual job: ${error.message}`);
        }
      }

      logger.info(`✅ MongoDB save completed:`);
      logger.info(`   💾 Saved: ${results.saved} jobs`);
      logger.info(`   🔄 Duplicates: ${results.duplicates} jobs`);
      logger.info(`   ❌ Errors: ${results.errors} jobs`);

      return results;
      
    } catch (error) {
      logger.error(`❌ Failed to save jobs to MongoDB: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getStats() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const totalJobs = await this.collection.countDocuments();
      const experimentalJobs = await this.collection.countDocuments({ experimentalScraper: true });
      const recentJobs = await this.collection.countDocuments({
        scrapedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      const sourceStats = await this.collection.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();

      return {
        totalJobs,
        experimentalJobs,
        recentJobs,
        sourceBreakdown: sourceStats
      };
      
    } catch (error) {
      logger.error(`❌ Failed to get stats: ${error.message}`);
      return null;
    }
  }

  /**
   * Test the connection and basic operations
   */
  async testConnection() {
    try {
      const connected = await this.connect();
      if (!connected) {
        return false;
      }

      // Test basic operations
      await this.collection.findOne({});
      const stats = await this.getStats();
      
      logger.info('✅ MongoDB connection test successful');
      logger.info(`📊 Current database stats:`, stats);
      
      return true;
      
    } catch (error) {
      logger.error(`❌ MongoDB connection test failed: ${error.message}`);
      return false;
    }
  }
}

module.exports = MongoDBIntegration; 