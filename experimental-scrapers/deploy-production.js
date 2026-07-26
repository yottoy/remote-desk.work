const ProductionOnlineJobsScraper = require('./src/scrapers/ProductionOnlineJobsScraper');
const MongoDBIntegration = require('./src/database/MongoDBIntegration');
const logger = require('./src/utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * Production deployment script for OnlineJobs.ph scraper
 * Streamlined to focus only on VA/admin/data entry jobs
 */
class ProductionDeployment {
  constructor(config = {}) {
    this.config = {
      // OnlineJobs.ph configuration
      onlineJobsMaxPages: config.onlineJobsMaxPages || 25, // 750 jobs
      onlineJobsBatchSize: config.onlineJobsBatchSize || 5,
      onlineJobsDelayBetweenBatches: config.onlineJobsDelayBetweenBatches || 60000, // 1 minute
      
      // Scheduling configuration
      scrapeInterval: config.scrapeInterval || 6 * 60 * 60 * 1000, // 6 hours
      
      // Output configuration
      outputDir: config.outputDir || './production-data',
      
      // MongoDB configuration
      mongoConnectionString: process.env.MONGODB_URI,
      mongoDatabaseName: 'clickclickjob',
      mongoCollectionName: 'jobs',
      
      // Quality filters
      minCredibilityScore: config.minCredibilityScore || 7,
      requireSalary: config.requireSalary || false,
      remoteOnly: config.remoteOnly || true,
      
      ...config
    };
    
    this.isRunning = false;
    this.lastRun = null;
    this.totalJobsScraped = 0;
    this.stats = {
      onlineJobs: { total: 0, remote: 0, withSalary: 0, saved: 0, duplicates: 0 }
    };
    
    // Initialize MongoDB integration
    this.mongodb = new MongoDBIntegration({
      connectionString: this.config.mongoConnectionString,
      databaseName: 'clickclickjob',
      collectionName: this.config.mongoCollectionName
    });
  }

  /**
   * Initialize production deployment
   */
  async initialize() {
    try {
      logger.info('🚀 Initializing OnlineJobs.ph Production Scraper');
      
      // Test MongoDB connection
      logger.info('🔌 Testing MongoDB connection...');
      const mongoConnected = await this.mongodb.testConnection();
      if (!mongoConnected) {
        throw new Error('Failed to connect to MongoDB');
      }
      
      // Create output directory
      if (!fs.existsSync(this.config.outputDir)) {
        fs.mkdirSync(this.config.outputDir, { recursive: true });
        logger.info(`📁 Created output directory: ${this.config.outputDir}`);
      }
      
      // Initialize OnlineJobs.ph scraper
      this.onlineJobsScraper = new ProductionOnlineJobsScraper({
        maxPages: this.config.onlineJobsMaxPages,
        batchSize: this.config.onlineJobsBatchSize,
        delayBetweenBatches: this.config.onlineJobsDelayBetweenBatches,
        headless: true
      });
      
      logger.info('✅ OnlineJobs.ph scraper initialized successfully');
      
      // Log configuration
      logger.info('📋 Production Configuration:');
      logger.info(`   OnlineJobs.ph: ${this.config.onlineJobsMaxPages} pages (${this.config.onlineJobsMaxPages * 30} jobs capacity)`);
      logger.info(`   Scrape interval: ${this.config.scrapeInterval / 1000 / 60 / 60} hours`);
      logger.info(`   Output directory: ${this.config.outputDir}`);
      logger.info(`   MongoDB: ${this.config.mongoDatabaseName}.${this.config.mongoCollectionName}`);
      logger.info(`   Remote only: ${this.config.remoteOnly}`);
      
      return true;
      
    } catch (error) {
      logger.error(`❌ Failed to initialize production deployment: ${error.message}`);
      return false;
    }
  }

  /**
   * Run a complete scraping cycle
   */
  async runScrapingCycle() {
    try {
      logger.info('🔄 Starting OnlineJobs.ph scraping cycle');
      const cycleStart = Date.now();
      
      // Scrape OnlineJobs.ph
      logger.info('📊 Scraping OnlineJobs.ph...');
      const onlineJobs = await this.onlineJobsScraper.scrape();
      
      if (!onlineJobs || onlineJobs.length === 0) {
        logger.warn('⚠️ No jobs scraped from OnlineJobs.ph');
        return {
          success: false,
          error: 'No jobs found'
        };
      }
      
      // Filter jobs based on quality criteria
      const filteredJobs = this.filterJobs(onlineJobs);
      
      this.stats.onlineJobs = {
        total: onlineJobs.length,
        remote: onlineJobs.filter(job => job.isRemote).length,
        withSalary: onlineJobs.filter(job => job.salary).length
      };
      
      logger.info(`✅ OnlineJobs.ph: ${filteredJobs.length}/${onlineJobs.length} jobs (after filtering)`);
      
      if (filteredJobs.length === 0) {
        logger.warn('⚠️ No jobs passed quality filters');
        return {
          success: false,
          error: 'No jobs passed quality filters'
        };
      }
      
      // Save to MongoDB
      logger.info('💾 Saving jobs to MongoDB...');
      const mongoResults = await this.mongodb.saveJobs(filteredJobs, 'onlinejobs.ph');
      
      this.stats.onlineJobs.saved = mongoResults.saved;
      this.stats.onlineJobs.duplicates = mongoResults.duplicates;
      
      // Save backup files
      const fileResults = await this.saveResults(filteredJobs);
      
      const cycleEnd = Date.now();
      const cycleDuration = Math.round((cycleEnd - cycleStart) / 1000 / 60); // minutes
      
      this.lastRun = new Date();
      this.totalJobsScraped += mongoResults.saved;
      
      logger.info(`🎉 Scraping cycle completed in ${cycleDuration} minutes`);
      logger.info(`📈 Total jobs found: ${filteredJobs.length}`);
      logger.info(`💾 MongoDB: ${mongoResults.saved} saved, ${mongoResults.duplicates} duplicates, ${mongoResults.errors} errors`);
      logger.info(`📊 Lifetime total: ${this.totalJobsScraped} jobs saved to database`);
      
      return {
        success: true,
        jobCount: filteredJobs.length,
        savedCount: mongoResults.saved,
        duplicateCount: mongoResults.duplicates,
        duration: cycleDuration,
        stats: this.stats,
        mongoResults: mongoResults,
        outputFile: fileResults.filename
      };
      
    } catch (error) {
      logger.error(`❌ Scraping cycle failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Filter jobs based on quality criteria
   */
  filterJobs(jobs) {
    return jobs.filter(job => {
      // Basic quality checks
      if (!job.title || !job.company || job.title.length < 3) {
        return false;
      }
      
      // Credibility score check
      if (job.credibilityScore && job.credibilityScore < this.config.minCredibilityScore) {
        return false;
      }
      
      // Remote only filter
      if (this.config.remoteOnly && !job.isRemote) {
        return false;
      }
      
      // Salary requirement
      if (this.config.requireSalary && (!job.salary || job.salary.length === 0)) {
        return false;
      }
      
      // Add source information
      job.scrapedFrom = 'onlinejobs.ph';
      job.scrapedAt = new Date().toISOString();
      
      return true;
    });
  }

  /**
   * Save results to files
   */
  async saveResults(jobs) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `onlinejobs-${timestamp}.json`;
      const filepath = path.join(this.config.outputDir, filename);
      
      // Create comprehensive output
      const output = {
        metadata: {
          scrapedAt: new Date().toISOString(),
          totalJobs: jobs.length,
          source: 'onlinejobs.ph',
          stats: this.stats,
          config: {
            onlineJobsMaxPages: this.config.onlineJobsMaxPages,
            remoteOnly: this.config.remoteOnly,
            minCredibilityScore: this.config.minCredibilityScore
          },
          version: '2.0'
        },
        jobs: jobs
      };
      
      // Save main file
      fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
      
      // Save latest file (for easy access)
      const latestPath = path.join(this.config.outputDir, 'latest-onlinejobs.json');
      fs.writeFileSync(latestPath, JSON.stringify(output, null, 2));
      
      // Save CSV for easy viewing
      const csvPath = path.join(this.config.outputDir, `onlinejobs-${timestamp}.csv`);
      this.saveAsCSV(jobs, csvPath);
      
      logger.info(`💾 Results saved to: ${filepath}`);
      logger.info(`💾 Latest results: ${latestPath}`);
      logger.info(`📊 CSV export: ${csvPath}`);
      
      return { filename: filepath, latestPath, csvPath };
      
    } catch (error) {
      logger.error(`❌ Failed to save results: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save jobs as CSV
   */
  saveAsCSV(jobs, filepath) {
    try {
      const headers = ['Title', 'Company', 'Location', 'Salary', 'URL', 'Posted Date', 'Is Remote', 'Category'];
      const rows = jobs.map(job => [
        job.title || '',
        job.company || '',
        job.location || '',
        job.salary || '',
        job.url || '',
        job.postedDate ? new Date(job.postedDate).toISOString().split('T')[0] : '',
        job.isRemote ? 'Yes' : 'No',
        job.category || ''
      ]);
      
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      fs.writeFileSync(filepath, csvContent);
      
    } catch (error) {
      logger.error(`❌ Failed to save CSV: ${error.message}`);
    }
  }

  /**
   * Start continuous monitoring
   */
  async startContinuousMonitoring() {
    try {
      logger.info('🔄 Starting continuous OnlineJobs.ph monitoring');
      this.isRunning = true;
      
      // Run initial cycle
      await this.runScrapingCycle();
      
      // Schedule recurring cycles
      const intervalId = setInterval(async () => {
        if (this.isRunning) {
          logger.info('⏰ Scheduled scraping cycle starting...');
          await this.runScrapingCycle();
        }
      }, this.config.scrapeInterval);
      
      logger.info(`✅ Continuous monitoring started (every ${this.config.scrapeInterval / 1000 / 60 / 60} hours)`);
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        logger.info('🛑 Shutting down gracefully...');
        this.isRunning = false;
        clearInterval(intervalId);
        process.exit(0);
      });
      
      return intervalId;
      
    } catch (error) {
      logger.error(`❌ Failed to start continuous monitoring: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      totalJobsScraped: this.totalJobsScraped,
      stats: this.stats,
      config: this.config
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'run-once';
  
  const deployment = new ProductionDeployment({
    onlineJobsMaxPages: 25, // 750 jobs capacity
    scrapeInterval: 6 * 60 * 60 * 1000, // 6 hours
    outputDir: './production-data',
    remoteOnly: true,
    minCredibilityScore: 7
  });
  
  try {
    const initialized = await deployment.initialize();
    if (!initialized) {
      process.exit(1);
    }
    
    switch (command) {
      case 'run-once':
        logger.info('🎯 Running single OnlineJobs.ph scraping cycle');
        const result = await deployment.runScrapingCycle();
        if (result.success) {
          logger.info(`✅ Cycle completed: ${result.savedCount} new jobs saved to database`);
          logger.info(`📊 Total found: ${result.jobCount}, Duplicates: ${result.duplicateCount}`);
        } else {
          logger.error(`❌ Cycle failed: ${result.error}`);
          process.exit(1);
        }
        // The MongoDB client holds the event loop open, so a successful cycle
        // would hang here until CI kills it at the 6h limit. Close and exit.
        await deployment.mongodb.disconnect();
        process.exit(0);
        
      case 'monitor':
        logger.info('🔄 Starting continuous monitoring');
        await deployment.startContinuousMonitoring();
        break;
        
      case 'status':
        const status = deployment.getStatus();
        logger.info('📊 Current Status:');
        logger.info(JSON.stringify(status, null, 2));
        break;
        
      default:
        logger.info('📖 Usage:');
        logger.info('   node deploy-production.js run-once    # Run single scraping cycle');
        logger.info('   node deploy-production.js monitor     # Start continuous monitoring');
        logger.info('   node deploy-production.js status      # Show current status');
        break;
    }
    
  } catch (error) {
    logger.error(`❌ Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ProductionDeployment; 