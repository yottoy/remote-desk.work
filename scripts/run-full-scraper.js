#!/usr/bin/env node

/**
 * Comprehensive script to run the full job scraping pipeline for ClickClickJob.com
 * 
 * This script:
 * 1. Starts the Python bridge if it's not already running
 * 2. Runs the scrapers with expanded search terms
 * 3. Stores results in MongoDB
 * 4. Generates a report of the process
 */

const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const axios = require('axios');
const http = require('http');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Configuration
const BRIDGE_PORT = process.env.JOBSPY_BRIDGE_PORT || 8000;
const BRIDGE_HOST = process.env.JOBSPY_BRIDGE_HOST || '127.0.0.1';
const BRIDGE_URL = `http://${BRIDGE_HOST}:${BRIDGE_PORT}`;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clickclickjob';
const REPORT_DIR = path.join(__dirname, '..', 'reports');
const MAX_PARALLEL_SCRAPERS = 1; // Increase if your system can handle more concurrent scrapers

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Logger
const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] INFO: ${message}`);
  },
  error: (message) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`);
  },
  warn: (message) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARNING: ${message}`);
  },
  success: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] SUCCESS: ${message}`);
  }
};

// Store child processes for cleanup
const childProcesses = [];

// Helper: Wait for a specific amount of time
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: Check if a port is in use
async function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const net = require('net');
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.close();
        resolve(false);
      })
      .listen(port, host);
  });
}

// Helper: Check if bridge is responding to HTTP requests
async function isBridgeResponding() {
  return new Promise((resolve) => {
    const req = http.get(BRIDGE_URL, {
      timeout: 5000,
    }, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            // Check for expected response format
            if (response && response.message && response.message.includes('JobSpy Bridge API')) {
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (e) {
            resolve(false);
          }
        });
      } else {
        resolve(false);
      }
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Cleanup function for child processes
function cleanup() {
  logger.info('Cleaning up child processes...');
  childProcesses.forEach(process => {
    try {
      if (process.pid) {
        process.kill();
      }
    } catch (error) {
      // Ignore errors during cleanup
    }
  });
}

// Helper: Start Python bridge
async function startBridge(retryLimit = 3) {
  for (let attempt = 1; attempt <= retryLimit; attempt++) {
    try {
      // Check if bridge is already running
      const bridgeRunning = await isBridgeResponding();
      if (bridgeRunning) {
        logger.success('JobSpy bridge is already running');
        return true;
      }

      // Check if port is in use (but not by our bridge)
      const portInUse = await isPortInUse(BRIDGE_PORT, BRIDGE_HOST);
      if (portInUse) {
        logger.warn(`Port ${BRIDGE_PORT} is in use but not by our bridge. Attempting to release it...`);
        try {
          // Try to find and kill the process using the port (platform-specific)
          if (process.platform === 'win32') {
            execSync(`FOR /F "tokens=5" %P IN ('netstat -aon ^| findstr :${BRIDGE_PORT}') DO taskkill /F /PID %P`);
          } else {
            execSync(`lsof -i :${BRIDGE_PORT} | grep LISTEN | awk '{print $2}' | xargs kill -9`);
          }
          // Wait a moment for the port to be released
          await delay(1000);
        } catch (error) {
          logger.error(`Failed to release port ${BRIDGE_PORT}: ${error.message}`);
          if (attempt === retryLimit) {
            throw new Error(`Port ${BRIDGE_PORT} is in use and could not be released. Please free this port manually.`);
          }
          continue;
        }
      }

      // Start the bridge
      logger.info('Starting JobSpy bridge...');
      const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
      const bridgeScriptPath = path.join(__dirname, '..', 'python-bridge', 'jobspy_bridge.py');
      
      if (!fs.existsSync(bridgeScriptPath)) {
        throw new Error(`Bridge script not found at: ${bridgeScriptPath}`);
      }
      
      const bridgeProcess = spawn(pythonPath, [bridgeScriptPath], {
        env: {
          ...process.env,
          JOBSPY_BRIDGE_PORT: BRIDGE_PORT,
          JOBSPY_BRIDGE_HOST: BRIDGE_HOST
        }
      });
      
      childProcesses.push(bridgeProcess);
      
      // Collect bridge output
      let bridgeOutput = '';
      
      bridgeProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        bridgeOutput += output + '\n';
        logger.info(`Bridge: ${output}`);
      });
      
      bridgeProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        bridgeOutput += output + '\n';
        logger.error(`Bridge error: ${output}`);
      });
      
      // Wait for bridge to be ready
      logger.info('Waiting for bridge to start...');
      const maxWaitTime = 30000; // 30 seconds
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWaitTime) {
        try {
          const isReady = await isBridgeResponding();
          if (isReady) {
            logger.success('Bridge started successfully!');
            return true;
          }
        } catch (error) {
          // Ignore connection errors while waiting
        }
        
        // Check if bridge process is still running
        if (bridgeProcess.exitCode !== null) {
          logger.error(`Bridge process exited with code ${bridgeProcess.exitCode}`);
          logger.error(`Bridge output: ${bridgeOutput}`);
          break;
        }
        
        await delay(1000);
      }
      
      // If we get here, bridge didn't start in time
      logger.error('Bridge failed to start within the expected time');
      if (attempt < retryLimit) {
        logger.info(`Retrying (attempt ${attempt + 1}/${retryLimit})...`);
        // Kill the previous process attempt
        try {
          bridgeProcess.kill();
        } catch (error) {
          // Ignore kill errors
        }
      } else {
        throw new Error('Failed to start bridge after multiple attempts');
      }
    } catch (error) {
      logger.error(`Error starting bridge (attempt ${attempt}/${retryLimit}): ${error.message}`);
      if (attempt === retryLimit) {
        throw error;
      }
      await delay(2000 * attempt); // Exponential backoff
    }
  }
  
  return false;
}

// Helper: Run a scraper and get results
async function runScraper(source, searchTerm, location = '') {
  try {
    logger.info(`Scraping ${source} for "${searchTerm}" in location "${location || 'any'}"...`);
    
    const response = await axios.post(`${BRIDGE_URL}/scrape-jobs`, {
      site_names: [source],
      search_terms: [searchTerm],
      location: location,
      results_wanted: 50,  // Request more results
      hours_old: 168,  // 7 days
      is_remote: true,
      country_indeed: "USA",
      distance: 100
    }, {
      timeout: 120000 // 2 minute timeout
    });
    
    const jobCount = response.data?.count || 0;
    logger.success(`Found ${jobCount} jobs from ${source} for "${searchTerm}"`);
    
    return {
      source,
      searchTerm,
      location,
      jobCount,
      jobs: response.data?.jobs || [],
      timestamp: new Date()
    };
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.detail || error.message;
    
    logger.error(`Failed to scrape ${source} for "${searchTerm}": ${message} (status: ${status || 'unknown'})`);
    
    return {
      source,
      searchTerm,
      location,
      jobCount: 0,
      jobs: [],
      error: message,
      status,
      timestamp: new Date()
    };
  }
}

// Helper: Save jobs to MongoDB
async function saveJobsToMongoDB(jobs) {
  if (!jobs || jobs.length === 0) {
    logger.warn('No jobs to save to MongoDB');
    return { saved: 0, duplicates: 0, errors: 0 };
  }
  
  const stats = {
    total: jobs.length,
    saved: 0,
    duplicates: 0,
    errors: 0
  };
  
  try {
    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    await client.connect();
    logger.info(`Connected to MongoDB: ${MONGODB_URI}`);
    
    const db = client.db();
    const jobsCollection = db.collection('jobs');
    
    // Process jobs in batches to avoid overwhelming MongoDB
    const batchSize = 50;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      // Process each job in the batch
      for (const job of batch) {
        try {
          // Add timestamps if not present
          job.createdAt = job.createdAt || new Date();
          job.updatedAt = new Date();
          
          // Check for duplicates by URL or title+company
          const query = job.url 
            ? { url: job.url } 
            : { title: job.title, company: job.company };
          
          const existing = await jobsCollection.findOne(query);
          
          if (existing) {
            // Update existing job
            const result = await jobsCollection.updateOne(
              { _id: existing._id },
              { $set: { ...job, updatedAt: new Date() } }
            );
            
            if (result.modifiedCount > 0) {
              stats.saved++;
            } else {
              stats.duplicates++;
            }
          } else {
            // Insert new job
            await jobsCollection.insertOne(job);
            stats.saved++;
          }
        } catch (error) {
          logger.error(`Error saving job: ${error.message}`);
          stats.errors++;
        }
      }
    }
    
    // Close MongoDB connection
    await client.close();
    logger.info(`Disconnected from MongoDB`);
    
    return stats;
  } catch (error) {
    logger.error(`MongoDB error: ${error.message}`);
    return { ...stats, error: error.message };
  }
}

// Helper: Generate summary report
function generateReport(results, mongoStats) {
  const totalJobs = results.reduce((total, result) => total + result.jobCount, 0);
  const sourceStats = {};
  
  // Compile stats by source
  results.forEach(result => {
    if (!sourceStats[result.source]) {
      sourceStats[result.source] = {
        jobCount: 0,
        searchTerms: {},
        locations: {},
        errors: 0
      };
    }
    
    sourceStats[result.source].jobCount += result.jobCount;
    
    // Track by search term
    if (!sourceStats[result.source].searchTerms[result.searchTerm]) {
      sourceStats[result.source].searchTerms[result.searchTerm] = 0;
    }
    sourceStats[result.source].searchTerms[result.searchTerm] += result.jobCount;
    
    // Track by location
    const locationKey = result.location || 'any';
    if (!sourceStats[result.source].locations[locationKey]) {
      sourceStats[result.source].locations[locationKey] = 0;
    }
    sourceStats[result.source].locations[locationKey] += result.jobCount;
    
    // Track errors
    if (result.error) {
      sourceStats[result.source].errors++;
    }
  });
  
  // Create report
  const report = {
    timestamp: new Date(),
    summary: {
      totalJobs,
      totalSearches: results.length,
      successfulSearches: results.filter(r => !r.error).length,
      failedSearches: results.filter(r => r.error).length,
      mongoStats: mongoStats || { saved: 0, duplicates: 0, errors: 0 }
    },
    sourceStats,
    results: results
  };
  
  // Save report to file
  const reportPath = path.join(REPORT_DIR, `scrape-report-${new Date().toISOString().replace(/:/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logger.info(`Report saved to ${reportPath}`);
  
  return report;
}

// Main function
async function main() {
  const startTime = Date.now();
  logger.info('Starting full job scraping pipeline');
  
  try {
    // 1. Start bridge
    await startBridge();
    
    // 2. Define sources, search terms, and locations to use
    const SOURCES = ['indeed', 'linkedin', 'naukri'];
    const SEARCH_TERMS = [
      'remote data entry',
      'remote administrative assistant',
      'virtual assistant remote',
      'remote customer service',
      'work from home data entry',
      'remote transcription',
      'remote administrative support',
      'remote office assistant',
      'remote data processing',
      'remote clerk',
      'data entry work from home',
      'remote admin assistant',
      'remote receptionist',
      'remote executive assistant',
      'work from home sales',
      'remote tech support',
      'remote project management',
      'virtual customer service',
      'remote marketing assistant',
      'content writer remote'
    ];
    const LOCATIONS = ['', 'USA', 'UK', 'Canada', 'Australia'];
    
    // 3. Run scrapers
    const scrapingTasks = [];
    const results = [];
    
    // Build the full task list
    for (const source of SOURCES) {
      for (const searchTerm of SEARCH_TERMS) {
        for (const location of LOCATIONS) {
          scrapingTasks.push({ source, searchTerm, location });
        }
      }
    }
    
    logger.info(`Created ${scrapingTasks.length} scraping tasks`);
    
    // Run tasks with limited concurrency
    for (let i = 0; i < scrapingTasks.length; i += MAX_PARALLEL_SCRAPERS) {
      const batch = scrapingTasks.slice(i, i + MAX_PARALLEL_SCRAPERS);
      const batchPromises = batch.map(task => 
        runScraper(task.source, task.searchTerm, task.location)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add a short delay between batches to avoid rate limiting
      if (i + MAX_PARALLEL_SCRAPERS < scrapingTasks.length) {
        await delay(3000);
      }
    }
    
    // 4. Extract all jobs from results
    const allJobs = results
      .flatMap(result => result.jobs)
      .filter(job => !!job); // Filter out null/undefined
    
    logger.info(`Total jobs collected: ${allJobs.length}`);
    
    // 5. Save to MongoDB
    const mongoStats = await saveJobsToMongoDB(allJobs);
    logger.info(`MongoDB stats: Saved ${mongoStats.saved}, duplicates ${mongoStats.duplicates}, errors ${mongoStats.errors}`);
    
    // 6. Generate report
    const report = generateReport(results, mongoStats);
    
    // 7. Print summary
    const duration = (Date.now() - startTime) / 1000;
    logger.success(`Job scraping pipeline completed in ${duration.toFixed(2)} seconds`);
    logger.success(`Total jobs found: ${report.summary.totalJobs}`);
    logger.success(`Jobs saved to MongoDB: ${mongoStats.saved}`);
    
    // Object.entries(report.sourceStats).forEach(([source, stats]) => {
    //   logger.info(`${source}: ${stats.jobCount} jobs found, ${stats.errors} errors`);
    // });
    
    cleanup();
    process.exit(0);
  } catch (error) {
    logger.error(`Error in scraping pipeline: ${error.message}`);
    cleanup();
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  logger.info('Received SIGINT. Cleaning up...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Cleaning up...');
  cleanup();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  logger.error(error.stack);
  cleanup();
  process.exit(1);
});

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error: ${error.message}`);
  logger.error(error.stack);
  cleanup();
  process.exit(1);
}); 