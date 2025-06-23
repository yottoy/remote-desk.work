/**
 * Periodic Data Maintenance Script for ClickClickJob
 * 
 * This script:
 * 1. Runs automatically on a schedule to maintain database quality
 * 2. Cleans up mock entries and low-quality data
 * 3. Logs results of each maintenance operation
 * 4. Can be configured to send notifications about cleanup results
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const config = {
  // Schedule settings (in milliseconds)
  runInterval: process.env.MAINTENANCE_INTERVAL || 24 * 60 * 60 * 1000, // Default: daily
  
  // Database settings
  databases: ['clickclickjob'], // Primary production database
  // Additional databases can be uncommented if needed 
  // databases: ['clickclickjob', 'test', 'remote-jobs'],
  
  // Cleanup thresholds
  minDescriptionLength: 20, // Descriptions shorter than this are considered low quality
  
  // Logging settings
  logDirectory: './logs',
  logRetentionDays: 30,
  
  // Notification settings (optional)
  notifications: {
    enabled: process.env.ENABLE_NOTIFICATIONS === 'true',
    recipient: process.env.NOTIFICATION_EMAIL,
    issuesThreshold: 100 // Minimum number of issues to trigger notification
  }
};

// Create log directory if it doesn't exist
if (!fs.existsSync(config.logDirectory)) {
  fs.mkdirSync(config.logDirectory, { recursive: true });
}

// Logger setup
const logger = {
  logFile: null,
  
  initialize() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
    const logFileName = `maintenance_${dateStr}_${timeStr}.log`;
    this.logFile = path.join(config.logDirectory, logFileName);
    
    fs.writeFileSync(this.logFile, `=== ClickClickJob Database Maintenance Log ===\nStarted: ${date.toISOString()}\n\n`);
    console.log(`Logging to: ${this.logFile}`);
  },
  
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(message);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  },

  error(message, error) {
    const errorMsg = `ERROR: ${message} - ${error.message}`;
    console.error(errorMsg);
    fs.appendFileSync(this.logFile, `[${new Date().toISOString()}] ${errorMsg}\n`);
    if (error.stack) {
      fs.appendFileSync(this.logFile, `Stack: ${error.stack}\n`);
    }
  }
};

// Clean up old log files
function cleanupOldLogs() {
  const currentTime = new Date().getTime();
  const retentionPeriod = config.logRetentionDays * 24 * 60 * 60 * 1000;
  
  try {
    const files = fs.readdirSync(config.logDirectory);
    files.forEach(file => {
      if (file.startsWith('maintenance_') && file.endsWith('.log')) {
        const filePath = path.join(config.logDirectory, file);
        const fileStat = fs.statSync(filePath);
        
        if (currentTime - fileStat.mtime.getTime() > retentionPeriod) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old log file: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error(`Error cleaning up old logs: ${error.message}`);
  }
}

// Database maintenance function
async function performDatabaseMaintenance() {
  logger.initialize();
  logger.log('Starting database maintenance process');
  
  let client;
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MongoDB URI not provided in environment variables');
    }
    
    logger.log('Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    logger.log('Connected to MongoDB successfully');
    
    // Maintenance summary
    const results = {
      mockEntriesRemoved: 0,
      emptyDescriptionsRemoved: 0,
      lowQualityRemoved: 0,
      totalRemoved: 0,
      totalProcessed: 0,
      errorCount: 0
    };

    // Process each database
    for (const dbName of config.databases) {
      const db = client.db(dbName);
      logger.log(`\nProcessing database: ${dbName}`);

      // Check if the jobs collection exists
      const collections = await db.listCollections({ name: 'jobs' }).toArray();
      if (collections.length === 0) {
        logger.log(`No 'jobs' collection found in ${dbName} database.`);
        continue;
      }

      const jobsCollection = db.collection('jobs');
      
      // Get total job count before maintenance
      const totalJobs = await jobsCollection.countDocuments();
      logger.log(`Total jobs in ${dbName}.jobs before maintenance: ${totalJobs}`);
      results.totalProcessed += totalJobs;
      
      // 1. STEP: Remove mock entries (fallback data)
      logger.log('Removing mock/fallback entries...');
      const mockQuery = {
        $or: [
          { url: { $regex: 'example.com', $options: 'i' } },
          { url: { $regex: 'fallback', $options: 'i' } },
          { url: { $regex: 'mock', $options: 'i' } },
          { is_mock_data: true },
          { mock_reason: { $exists: true } },
          { isMock: true },
          { source: 'mock_data' }
        ]
      };
      
      try {
        const mockCount = await jobsCollection.countDocuments(mockQuery);
        if (mockCount > 0) {
          const deleteResult = await jobsCollection.deleteMany(mockQuery);
          logger.log(`Deleted ${deleteResult.deletedCount} mock entries`);
          results.mockEntriesRemoved += deleteResult.deletedCount;
        } else {
          logger.log('No mock entries found');
        }
      } catch (error) {
        logger.error(`Failed to clean mock entries from ${dbName}`, error);
        results.errorCount++;
      }
      
      // 2. STEP: Remove entries with missing or empty descriptions
      logger.log('Removing entries with empty descriptions...');
      const missingDescQuery = {
        $or: [
          { $and: [
            { description: { $exists: false } },
            { descriptionText: { $exists: false } }
          ]},
          { $and: [
            { description: null },
            { descriptionText: null }
          ]},
          { $and: [
            { description: "" },
            { descriptionText: "" }
          ]}
        ]
      };
      
      try {
        const emptyDescCount = await jobsCollection.countDocuments(missingDescQuery);
        if (emptyDescCount > 0) {
          const deleteResult = await jobsCollection.deleteMany(missingDescQuery);
          logger.log(`Deleted ${deleteResult.deletedCount} entries with empty descriptions`);
          results.emptyDescriptionsRemoved += deleteResult.deletedCount;
        } else {
          logger.log('No entries with empty descriptions found');
        }
      } catch (error) {
        logger.error(`Failed to clean empty descriptions from ${dbName}`, error);
        results.errorCount++;
      }
      
      // 3. STEP: Remove very low-quality entries with extremely short descriptions
      logger.log(`Removing entries with very short descriptions (<${config.minDescriptionLength} chars)...`);
      const shortDescQuery = {
        $or: [
          { 
            description: { $exists: true, $ne: null, $ne: "", $type: "string" }, 
            $expr: { $lt: [{ $strLenCP: "$description" }, config.minDescriptionLength] } 
          },
          { 
            descriptionText: { $exists: true, $ne: null, $ne: "", $type: "string" }, 
            $expr: { $lt: [{ $strLenCP: "$descriptionText" }, config.minDescriptionLength] } 
          }
        ]
      };
      
      try {
        const shortDescCount = await jobsCollection.countDocuments(shortDescQuery);
        if (shortDescCount > 0) {
          const deleteResult = await jobsCollection.deleteMany(shortDescQuery);
          logger.log(`Deleted ${deleteResult.deletedCount} entries with very short descriptions`);
          results.lowQualityRemoved += deleteResult.deletedCount;
        } else {
          logger.log('No entries with very short descriptions found');
        }
      } catch (error) {
        logger.error(`Failed to clean short descriptions from ${dbName}`, error);
        results.errorCount++;
      }
      
      // Get final count for this database
      const remainingJobs = await jobsCollection.countDocuments();
      const removedFromDb = totalJobs - remainingJobs;
      logger.log(`Removed ${removedFromDb} jobs from ${dbName}`);
      logger.log(`Remaining jobs: ${remainingJobs}`);
      
      results.totalRemoved += removedFromDb;
    }

    // Log final summary
    logger.log('\n====== MAINTENANCE SUMMARY ======');
    logger.log(`Processed ${results.totalProcessed} jobs across all databases`);
    logger.log(`Removed ${results.totalRemoved} entries in total:`);
    logger.log(`- Mock/fallback entries: ${results.mockEntriesRemoved}`);
    logger.log(`- Entries with empty descriptions: ${results.emptyDescriptionsRemoved}`);
    logger.log(`- Entries with very short descriptions: ${results.lowQualityRemoved}`);
    if (results.errorCount > 0) {
      logger.log(`Encountered ${results.errorCount} errors during maintenance`);
    }
    
    // Send notification if enabled and threshold exceeded
    if (config.notifications.enabled && 
        config.notifications.recipient &&
        results.totalRemoved >= config.notifications.issuesThreshold) {
      try {
        sendNotification(results);
      } catch (error) {
        logger.error('Failed to send notification', error);
      }
    }
    
    return results;
  } catch (error) {
    logger.error('Maintenance process failed', error);
    throw error;
  } finally {
    // Close MongoDB connection
    if (client) {
      try {
        await client.close();
        logger.log('Disconnected from MongoDB');
      } catch (error) {
        logger.error('Error disconnecting from MongoDB', error);
      }
    }
    
    // Log completion time
    logger.log(`Maintenance process completed at ${new Date().toISOString()}`);
  }
}

// Function to send notification (customize as needed)
function sendNotification(results) {
  // This is a placeholder for notification functionality
  // In a real implementation, you would use an email service, Slack API, etc.
  logger.log(`Would send notification to ${config.notifications.recipient} about ${results.totalRemoved} removed entries`);
  
  // Example: If you want to implement email notification via system mail command:
  /*
  const subject = `ClickClickJob DB Maintenance: ${results.totalRemoved} entries removed`;
  const body = `
Database maintenance completed with the following results:

- Total entries processed: ${results.totalProcessed}
- Total entries removed: ${results.totalRemoved}
- Mock entries removed: ${results.mockEntriesRemoved}
- Empty descriptions removed: ${results.emptyDescriptionsRemoved}
- Low quality entries removed: ${results.lowQualityRemoved}

See the full log for more details.
`;
  
  exec(`echo "${body}" | mail -s "${subject}" ${config.notifications.recipient}`, 
    (error, stdout, stderr) => {
      if (error) {
        logger.error(`Failed to send email notification: ${error.message}`);
        return;
      }
      logger.log(`Notification email sent to ${config.notifications.recipient}`);
    }
  );
  */
}

// Function to run as a scheduled task
function scheduleNextRun() {
  logger.log(`Scheduling next maintenance run in ${config.runInterval / (60 * 60 * 1000)} hours`);
  setTimeout(() => {
    cleanupOldLogs();
    performDatabaseMaintenance()
      .then(() => scheduleNextRun())
      .catch(error => {
        console.error(`Fatal error in maintenance process: ${error.message}`);
        // Try to reschedule even after error
        scheduleNextRun();
      });
  }, config.runInterval);
}

// Handle script execution
if (require.main === module) {
  // If run directly (node periodic-data-maintenance.js)
  if (process.argv.includes('--now')) {
    // Run maintenance immediately if --now flag is provided
    cleanupOldLogs();
    performDatabaseMaintenance()
      .catch(error => {
        console.error(`Maintenance failed: ${error.message}`);
        process.exit(1);
      });
  } else if (process.argv.includes('--cron')) {
    // For cron job usage - run once and exit
    cleanupOldLogs();
    performDatabaseMaintenance()
      .then(() => process.exit(0))
      .catch(error => {
        console.error(`Maintenance failed: ${error.message}`);
        process.exit(1);
      });
  } else {
    // Run as a continuous service with scheduled runs
    console.log("=================================");
    console.log("ClickClickJob Periodic Maintenance Service");
    console.log("=================================");
    console.log("Service started. The first maintenance run will begin momentarily.");
    console.log(`Subsequent runs will occur every ${config.runInterval / (60 * 60 * 1000)} hours.`);
    console.log("Use Ctrl+C to stop the service.");
    console.log("");
    cleanupOldLogs();
    
    // Run maintenance immediately, then schedule next runs
    performDatabaseMaintenance()
      .then(() => scheduleNextRun())
      .catch(error => {
        console.error(`Initial maintenance failed: ${error.message}`);
        // Schedule next run even if initial run fails
        scheduleNextRun();
      });
  }
}

module.exports = {
  performDatabaseMaintenance,
  cleanupOldLogs
}; 