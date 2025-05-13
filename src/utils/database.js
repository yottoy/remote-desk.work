const { MongoClient, ObjectId } = require('mongodb');
const logger = require('./logger');

/**
 * Database utility for MongoDB operations
 */
class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.useInMemory = false;
    this.inMemoryJobs = [];
  }

  /**
   * Connect to MongoDB
   * @returns {Promise<boolean>} - Connection success
   */
  async connect() {
    if (this.isConnected) {
      return true;
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      logger.warn('MongoDB URI not provided in environment variables. Using in-memory storage.');
      this.useInMemory = true;
      return true;
    }

    try {
      logger.info('Connecting to MongoDB...');
      this.client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      logger.info('Connected to MongoDB');
      return true;
    } catch (error) {
      logger.error(`Failed to connect to MongoDB: ${error.message}`);
      this.useInMemory = true;
      return false;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      try {
        await this.client.close();
        this.isConnected = false;
        logger.info('Disconnected from MongoDB');
      } catch (error) {
        logger.error(`Error disconnecting from MongoDB: ${error.message}`);
      }
    }
  }

  /**
   * Save job listings to database
   * @param {Array} jobs - Job listings to save
   * @param {boolean} deduplicateUrls - Whether to deduplicate by URL
   * @returns {Promise<Object>} - Result statistics
   */
  async saveJobs(jobs, deduplicateUrls = true) {
    if (this.useInMemory) {
      return this._saveJobsInMemory(jobs, deduplicateUrls);
    }

    if (!this.isConnected) {
      await this.connect();
    }

    const stats = {
      total: jobs.length,
      saved: 0,
      duplicates: 0,
      errors: 0
    };

    try {
      const jobsCollection = this.db.collection('jobs');
      
      // Process jobs in batches to avoid overwhelming MongoDB
      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < jobs.length; i += batchSize) {
        batches.push(jobs.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        for (const job of batch) {
          try {
            // Add timestamp if not present
            job.createdAt = job.createdAt || new Date();
            job.updatedAt = new Date();
            
            // Check for duplicates if needed
            if (deduplicateUrls && job.url) {
              const existing = await jobsCollection.findOne({ url: job.url });
              if (existing) {
                // Update existing job
                const result = await jobsCollection.updateOne(
                  { url: job.url },
                  { $set: { ...job, updatedAt: new Date() } }
                );
                
                if (result.modifiedCount > 0) {
                  stats.saved++;
                } else {
                  stats.duplicates++;
                }
                continue;
              }
            }
            
            // Insert new job
            await jobsCollection.insertOne(job);
            stats.saved++;
          } catch (error) {
            logger.error(`Error saving job: ${error.message}`);
            stats.errors++;
          }
        }
      }
      
      logger.info(`Saved ${stats.saved} jobs to MongoDB (${stats.duplicates} duplicates, ${stats.errors} errors)`);
      return stats;
    } catch (error) {
      logger.error(`Database error: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Save jobs to in-memory storage (fallback)
   * @param {Array} jobs - Job listings
   * @param {boolean} deduplicateUrls - Whether to deduplicate by URL
   * @returns {Object} - Result statistics
   * @private
   */
  _saveJobsInMemory(jobs, deduplicateUrls) {
    const stats = {
      total: jobs.length,
      saved: 0,
      duplicates: 0,
      errors: 0
    };
    
    for (const job of jobs) {
      try {
        // Add timestamp if not present
        job.createdAt = job.createdAt || new Date();
        job.updatedAt = new Date();
        
        // Check for duplicates if needed
        if (deduplicateUrls && job.url) {
          const existingIndex = this.inMemoryJobs.findIndex(j => j.url === job.url);
          if (existingIndex >= 0) {
            // Update existing job
            this.inMemoryJobs[existingIndex] = { ...job };
            stats.duplicates++;
            continue;
          }
        }
        
        // Add new job
        this.inMemoryJobs.push(job);
        stats.saved++;
      } catch (error) {
        logger.error(`Error saving job in memory: ${error.message}`);
        stats.errors++;
      }
    }
    
    logger.info(`Saved ${stats.saved} jobs to in-memory storage (${stats.duplicates} duplicates, ${stats.errors} errors)`);
    return stats;
  }
  
  /**
   * Get total job count
   * @returns {Promise<number>} - Job count
   */
  async getJobCount() {
    if (this.useInMemory) {
      return this.inMemoryJobs.length;
    }
    
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      const count = await this.db.collection('jobs').countDocuments();
      return count;
    } catch (error) {
      logger.error(`Error getting job count: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Get featured job count (high quality jobs)
   * @param {number} threshold - Quality threshold
   * @returns {Promise<number>} - Featured job count
   */
  async getFeaturedJobCount(threshold = 8) {
    if (this.useInMemory) {
      return this.inMemoryJobs.filter(job => job.credibilityScore >= threshold).length;
    }
    
    if (!this.isConnected) {
      await this.connect();
    }
    
    try {
      const count = await this.db.collection('jobs').countDocuments({ 
        credibilityScore: { $gte: threshold } 
      });
      return count;
    } catch (error) {
      logger.error(`Error getting featured job count: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Get database statistics
   * @returns {Promise<Object>} - Database statistics
   */
  async getStats() {
    return {
      totalJobs: await this.getJobCount(),
      featuredJobs: await this.getFeaturedJobCount(),
      isConnected: this.isConnected,
      usingInMemory: this.useInMemory
    };
  }
}

// Export a singleton instance
const database = new Database();
module.exports = database; 