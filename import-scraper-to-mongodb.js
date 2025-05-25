/**
 * Import Direct Scraper Results to MongoDB
 * 
 * This script imports the formatted combined-results.json file
 * into the clickclickjob.jobs MongoDB collection, replacing existing jobs
 * to ensure all job descriptions have proper formatting.
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Configure logger
const logger = {
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`)
};

// Configuration
const RESULTS_FILE = path.join(__dirname, 'results', 'combined-results.json');
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'clickclickjob';
const COLLECTION_NAME = 'jobs';

// Add timeout configuration
const MONGO_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000
};

/**
 * Read the combined results file
 */
async function readResultsFile() {
  try {
    if (!fs.existsSync(RESULTS_FILE)) {
      logger.error(`Results file not found: ${RESULTS_FILE}`);
      return null;
    }
    
    const data = fs.readFileSync(RESULTS_FILE, 'utf8');
    const parsedData = JSON.parse(data);
    
    // Handle both array format and object with jobs property
    const jobs = Array.isArray(parsedData) ? parsedData : 
                 (parsedData.jobs ? parsedData.jobs : []);
    
    logger.info(`Loaded ${jobs.length} jobs from ${RESULTS_FILE}`);
    return jobs;
  } catch (error) {
    logger.error(`Error reading results file: ${error.message}`);
    return null;
  }
}

/**
 * Import jobs to MongoDB, replacing existing ones
 */
async function importToMongoDB(jobs) {
  if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
    logger.warn('No jobs to import');
    return { saved: 0, updated: 0, errors: 0 };
  }
  
  if (!MONGODB_URI) {
    logger.error('MONGODB_URI environment variable is not set');
    return { error: 'MONGODB_URI not set' };
  }
  
  logger.info(`Importing ${jobs.length} jobs to MongoDB (${DB_NAME}.${COLLECTION_NAME})`);
  
  let client;
  
  try {
    // Connect to MongoDB with options
    client = new MongoClient(MONGODB_URI, MONGO_OPTIONS);
    
    logger.info('Attempting to connect to MongoDB...');
    logger.info(`Using database: ${DB_NAME}`);
    
    await client.connect();
    logger.info('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Get count before import
    const countBefore = await collection.countDocuments();
    logger.info(`Collection contains ${countBefore} jobs before import`);
    
    // Process jobs in batches
    const batchSize = 50;
    const stats = {
      processed: 0,
      inserted: 0,
      updated: 0,
      errors: 0
    };
    
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobs.length / batchSize)} (${batch.length} jobs)`);
      
      const operations = [];
      
      for (const job of batch) {
        try {
          // Standardize job fields
          const processedJob = {
            // Base job fields - ensure consistent schema
            title: job.title || 'Untitled Position',
            company: job.company || 'Unknown Company',
            description: job.description || '',
            descriptionText: job.descriptionText || '',
            location: job.location || 'Remote',
            salary: job.salary || '',
            // Preserve original posting date if available, otherwise use reasonable fallback
            postedDate: job.postedDate ? new Date(job.postedDate) : 
                       job.date_posted ? new Date(job.date_posted) : 
                       new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default to 7 days ago instead of today
            remote: true, // Admin and data entry jobs are remote
            url: job.url || '',
            source: job.source || job.site_source || 'direct_scraper',
            
            // Additional fields for job quality
            jobType: 'admin_data_entry',
            site_source: job.site_source || job.source || 'direct_scraper',
            
            // Timestamps
            scrapedDate: new Date(),
            updatedAt: new Date(),
            createdAt: job.createdAt ? new Date(job.createdAt) : new Date()
          };
          
          // Create unique identifier for matching
          let query;
          if (processedJob.url) {
            // Match by URL if available
            query = { url: processedJob.url };
          } else {
            // Match by title and company otherwise
            query = { 
              title: processedJob.title,
              company: processedJob.company
            };
          }
          
          operations.push({
            updateOne: {
              filter: query,
              update: { $set: processedJob },
              upsert: true
            }
          });
          
          stats.processed++;
        } catch (error) {
          logger.error(`Error processing job: ${error.message}`);
          stats.errors++;
        }
      }
      
      // Execute batch operations
      if (operations.length > 0) {
        try {
          const result = await collection.bulkWrite(operations);
          stats.inserted += result.upsertedCount || 0;
          stats.updated += result.modifiedCount || 0;
          logger.info(`Batch result: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);
        } catch (error) {
          logger.error(`Error executing batch operations: ${error.message}`);
          stats.errors += operations.length;
        }
      }
    }
    
    // Get count after import
    const countAfter = await collection.countDocuments();
    logger.info(`Collection contains ${countAfter} jobs after import (${countAfter - countBefore} net change)`);
    
    return stats;
  } catch (error) {
    logger.error(`MongoDB error: ${error.message}`);
    return { error: error.message };
  } finally {
    if (client) {
      await client.close();
      logger.info('Disconnected from MongoDB');
    }
  }
}

/**
 * Option to completely overwrite all jobs
 */
async function overwriteAllJobs(jobs) {
  if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
    logger.warn('No jobs to import');
    return { saved: 0, errors: 0 };
  }
  
  if (!MONGODB_URI) {
    logger.error('MONGODB_URI environment variable is not set');
    return { error: 'MONGODB_URI not set' };
  }
  
  logger.info(`COMPLETELY REPLACING ALL JOBS with ${jobs.length} new jobs in ${DB_NAME}.${COLLECTION_NAME}`);
  
  let client;
  
  try {
    // Connect to MongoDB with options
    client = new MongoClient(MONGODB_URI, MONGO_OPTIONS);
    
    logger.info('Attempting to connect to MongoDB...');
    logger.info(`Using database: ${DB_NAME}`);
    
    await client.connect();
    logger.info('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Create a backup collection
    const backupCollection = `${COLLECTION_NAME}_backup_${new Date().toISOString().replace(/[:.]/g, '_')}`;
    logger.info(`Creating backup in collection: ${backupCollection}`);
    
    // Copy all documents to backup collection
    const copyResult = await db.collection(COLLECTION_NAME).aggregate([
      { $match: {} },
      { $out: backupCollection }
    ]).toArray();
    
    const backupCount = await db.collection(backupCollection).countDocuments();
    logger.info(`Backed up ${backupCount} jobs to ${backupCollection}`);
    
    // Check for existing indexes that could cause problems
    logger.info('Checking for existing unique indexes...');
    const indexes = await collection.indexes();
    const uniqueIndexes = indexes.filter(idx => 
      idx.unique === true && 
      idx.name !== '_id_' // Skip the default _id index
    );
    
    // Store the unique indexes for restoration later
    const uniqueIndexesToRestore = [];
    for (const idx of uniqueIndexes) {
      uniqueIndexesToRestore.push({
        key: idx.key,
        name: idx.name,
        unique: true,
        background: idx.background || true,
        sparse: idx.sparse || false
      });
      
      // Drop the unique index temporarily
      logger.info(`Temporarily dropping unique index: ${idx.name}`);
      await collection.dropIndex(idx.name);
    }
    
    // Delete all documents from the main collection
    const deleteResult = await collection.deleteMany({});
    logger.info(`Deleted ${deleteResult.deletedCount} jobs from main collection`);
    
    // Process jobs in standardized format with unique identifiers
    const seenUrls = new Set();
    const seenTitleCompany = new Set();
    
    const processedJobs = [];
    let skippedCount = 0;
    
    for (const job of jobs) {
      const title = job.title || 'Untitled Position';
      const company = job.company || 'Unknown Company';
      const url = job.job_url || job.url || '';
      
      // Create a unique identifier to detect duplicates
      const titleCompanyKey = `${title}::${company}`;
      
      // Skip if we've already seen this URL or title+company combination
      if ((url && seenUrls.has(url)) || seenTitleCompany.has(titleCompanyKey)) {
        skippedCount++;
        continue;
      }
      
      // Mark as seen
      if (url) seenUrls.add(url);
      seenTitleCompany.add(titleCompanyKey);
      
      // Create processed job document
      processedJobs.push({
        // Base job fields - ensure consistent schema
        title: title,
        company: company,
        description: job.description || '',
        descriptionText: job.descriptionText || '',
        location: job.location || 'Remote',
        salary: job.salary || '',
        // Preserve original posting date if available, otherwise use reasonable fallback
        postedDate: job.postedDate ? new Date(job.postedDate) : 
                   job.date_posted ? new Date(job.date_posted) : 
                   new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default to 7 days ago instead of today
        remote: true, // Admin and data entry jobs are remote
        url: url,
        source: job.source || job.site_source || 'direct_scraper',
        
        // Additional fields for job quality
        jobType: 'admin_data_entry',
        site_source: job.site_source || job.source || 'direct_scraper',
        
        // Timestamps
        scrapedDate: new Date(),
        updatedAt: new Date(),
        createdAt: job.createdAt ? new Date(job.createdAt) : new Date()
      });
    }
    
    logger.info(`Processed ${processedJobs.length} unique jobs (skipped ${skippedCount} duplicates)`);
    
    // Insert all new jobs in batches to avoid memory issues
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < processedJobs.length; i += batchSize) {
      const batch = processedJobs.slice(i, i + batchSize);
      logger.info(`Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(processedJobs.length / batchSize)} (${batch.length} jobs)`);
      
      const result = await collection.insertMany(batch, { ordered: false });
      insertedCount += result.insertedCount;
    }
    
    logger.info(`Inserted ${insertedCount} new jobs`);
    
    // Restore the unique indexes if needed
    if (uniqueIndexesToRestore.length > 0) {
      logger.info(`Restoring ${uniqueIndexesToRestore.length} unique indexes...`);
      
      for (const idx of uniqueIndexesToRestore) {
        try {
          logger.info(`Recreating index: ${idx.name}`);
          await collection.createIndex(idx.key, {
            name: idx.name,
            unique: idx.unique,
            background: idx.background,
            sparse: idx.sparse
          });
        } catch (error) {
          logger.error(`Error recreating index ${idx.name}: ${error.message}`);
        }
      }
    }
    
    return {
      backed_up: backupCount,
      deleted: deleteResult.deletedCount,
      inserted: insertedCount,
      skipped: skippedCount
    };
  } catch (error) {
    logger.error(`MongoDB error: ${error.message}`);
    return { error: error.message };
  } finally {
    if (client) {
      await client.close();
      logger.info('Disconnected from MongoDB');
    }
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldOverwrite = args.includes('--overwrite') || args.includes('-o');
  
  try {
    logger.info('Starting import of scraper results to MongoDB');
    
    // Read scraper results
    const jobs = await readResultsFile();
    if (!jobs) {
      logger.error('Failed to read jobs from results file');
      process.exit(1);
    }
    
    // Import to MongoDB
    let result;
    if (shouldOverwrite) {
      logger.warn('Overwrite mode activated - will replace ALL jobs in the database');
      result = await overwriteAllJobs(jobs);
    } else {
      result = await importToMongoDB(jobs);
    }
    
    logger.info('Import completed');
    logger.info(`Results: ${JSON.stringify(result)}`);
    
    if (result.error) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    logger.error(`Unhandled error in main: ${error.message}`);
    process.exit(1);
  });
} 