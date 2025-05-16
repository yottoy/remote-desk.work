/**
 * Script to clean invalid URLs from the database
 * 
 * This script:
 * 1. Connects to the MongoDB database
 * 2. Finds all jobs with missing or invalid URLs (including example.com)
 * 3. Either deletes them or marks them as hidden
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const logger = require('./src/utils/logger');

// URL validation function (same as in AdminDataEntryScraper.js)
function isValidUrl(url) {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url);
    // Only allow http/https URLs and filter out example.com URLs
    if (!(parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') || 
        parsedUrl.hostname.includes('example.com')) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

async function cleanDatabase() {
  // Connect to MongoDB
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('MongoDB URI not provided in environment variables.');
    return;
  }

  let client;
  try {
    logger.info('Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const jobsCollection = db.collection('jobs');
    
    // Get total job count first
    const totalJobs = await jobsCollection.countDocuments();
    logger.info(`Total jobs in database: ${totalJobs}`);
    
    // Find jobs with invalid URLs
    const invalidUrlJobs = [];
    
    // Different types of URL issues to check
    const noUrlJobs = await jobsCollection.countDocuments({ url: { $exists: false } });
    const nullUrlJobs = await jobsCollection.countDocuments({ url: null });
    const emptyUrlJobs = await jobsCollection.countDocuments({ url: "" });
    const exampleUrlJobs = await jobsCollection.countDocuments({ url: { $regex: "example.com" } });
    
    logger.info(`Found jobs with URL issues:`);
    logger.info(`- Missing URL field: ${noUrlJobs}`);
    logger.info(`- Null URL: ${nullUrlJobs}`);
    logger.info(`- Empty URL: ${emptyUrlJobs}`);
    logger.info(`- Example.com URL: ${exampleUrlJobs}`);
    
    // Aggregate all jobs with URL issues
    const jobsToFix = await jobsCollection.find({
      $or: [
        { url: { $exists: false } },
        { url: null },
        { url: "" },
        { url: { $regex: "example.com" } }
      ]
    }).toArray();
    
    logger.info(`Found ${jobsToFix.length} jobs with invalid URLs to process`);
    
    // Option 1: Mark jobs as hidden (keeps them in the database but they won't be visible)
    if (process.argv.includes('--mark-hidden')) {
      const updateResult = await jobsCollection.updateMany(
        {
          $or: [
            { url: { $exists: false } },
            { url: null },
            { url: "" },
            { url: { $regex: "example.com" } }
          ]
        },
        { 
          $set: { 
            hidden: true, 
            hidden_reason: "Invalid URL",
            updated_at: new Date()
          }
        }
      );
      
      logger.info(`Marked ${updateResult.modifiedCount} jobs as hidden`);
    }
    // Option 2: Delete jobs (removes them completely)
    else if (process.argv.includes('--delete')) {
      const deleteResult = await jobsCollection.deleteMany({
        $or: [
          { url: { $exists: false } },
          { url: null },
          { url: "" },
          { url: { $regex: "example.com" } }
        ]
      });
      
      logger.info(`Deleted ${deleteResult.deletedCount} jobs with invalid URLs`);
    }
    // Default: Just report, don't make changes
    else {
      logger.info(`Found ${jobsToFix.length} jobs with invalid URLs.`);
      logger.info(`To fix, run with either --mark-hidden or --delete option:`);
      logger.info(`  node clean-invalid-urls.js --mark-hidden   # mark jobs as hidden`);
      logger.info(`  node clean-invalid-urls.js --delete        # delete jobs from the database`);
    }
    
    // Additional validation - scan through all URLs
    if (process.argv.includes('--deep-scan')) {
      logger.info("Performing deep scan of all URLs in the database...");
      
      // Use a separate query to avoid cursor issues
      const validUrlJobs = await jobsCollection.find({
        url: { $exists: true, $ne: null, $ne: "" },
        $nor: [{ url: { $regex: "example.com" } }]
      }).toArray();
      
      let processed = 0;
      let invalidFound = 0;
      const invalidUrls = [];
      
      for (const job of validUrlJobs) {
        processed++;
        
        if (!isValidUrl(job.url)) {
          invalidFound++;
          invalidUrls.push(job.url);
          
          // Update this job too if using one of the action flags
          if (process.argv.includes('--mark-hidden')) {
            await jobsCollection.updateOne(
              { _id: job._id },
              { 
                $set: { 
                  hidden: true, 
                  hidden_reason: "Invalid URL format",
                  updated_at: new Date() 
                }
              }
            );
          }
          else if (process.argv.includes('--delete')) {
            await jobsCollection.deleteOne({ _id: job._id });
          }
        }
        
        if (processed % 100 === 0) {
          logger.info(`Processed ${processed}/${validUrlJobs.length} jobs, found ${invalidFound} invalid URLs so far...`);
        }
      }
      
      logger.info(`Deep scan complete. Processed ${processed} jobs with URLs.`);
      logger.info(`Found ${invalidFound} additional jobs with invalid URL formats.`);
      
      if (invalidFound > 0 && invalidFound < 20) {
        logger.info("Sample of invalid URLs found:");
        invalidUrls.slice(0, 10).forEach(url => logger.info(`- ${url}`));
      }
    }
    
    // Final job count
    const remainingJobs = await jobsCollection.countDocuments();
    logger.info(`Remaining jobs in database: ${remainingJobs}`);
    logger.info(`Visible jobs: ${await jobsCollection.countDocuments({ hidden: { $ne: true } })}`);
    
  } catch (error) {
    logger.error(`Error: ${error.message}`);
  } finally {
    if (client) {
      await client.close();
      logger.info('Disconnected from MongoDB');
    }
  }
}

// Run the script
cleanDatabase().catch(err => {
  logger.error(`Fatal error: ${err.message}`);
  process.exit(1);
}); 