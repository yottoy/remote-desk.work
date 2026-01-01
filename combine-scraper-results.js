#!/usr/bin/env node
/**
 * Combine Results from All Scrapers
 * 
 * Reads individual scraper result files and combines them into a single
 * combined-results.json file for MongoDB import
 */

const fs = require('fs');
const path = require('path');

// Result files to combine
const RESULT_FILES = [
  'scrape-results.json',          // JobSpy scrapers (Indeed, LinkedIn, etc.)
  'alt-sites-results.json',       // Alternative sites
  'weworkremotely-results.json',  // WeWorkRemotely
  'remoteok-results.json',        // RemoteOK
  'remotive-results.json'         // Remotive
];

const OUTPUT_FILE = 'combined-results.json';

// Logger
const logger = {
  info: (msg) => console.log(`INFO: ${msg}`),
  warn: (msg) => console.warn(`WARNING: ${msg}`),
  error: (msg) => console.error(`ERROR: ${msg}`)
};

/**
 * Load jobs from a result file
 */
function loadResultFile(filename) {
  const filepath = path.join(__dirname, filename);
  
  if (!fs.existsSync(filepath)) {
    logger.warn(`File not found: ${filename}`);
    return [];
  }
  
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const data = JSON.parse(content);
    
    // Handle different formats
    let jobs = [];
    if (Array.isArray(data)) {
      jobs = data;
    } else if (data.jobs && Array.isArray(data.jobs)) {
      jobs = data.jobs;
    } else if (typeof data === 'object' && Object.keys(data).length > 0) {
      // Single job object
      jobs = [data];
    }
    
    logger.info(`Loaded ${jobs.length} jobs from ${filename}`);
    return jobs;
    
  } catch (error) {
    logger.error(`Error reading ${filename}: ${error.message}`);
    return [];
  }
}

/**
 * Combine all scraper results
 */
function combineResults() {
  logger.info('Starting to combine scraper results...');
  
  const allJobs = [];
  const seenUrls = new Set();
  let totalLoaded = 0;
  let duplicatesRemoved = 0;
  
  // Load all result files
  for (const filename of RESULT_FILES) {
    const jobs = loadResultFile(filename);
    totalLoaded += jobs.length;
    
    // Add jobs, removing duplicates by URL
    for (const job of jobs) {
      if (!job.job_url) {
        logger.warn(`Job without URL found in ${filename}, skipping`);
        continue;
      }
      
      if (seenUrls.has(job.job_url)) {
        duplicatesRemoved++;
        continue;
      }
      
      seenUrls.add(job.job_url);
      allJobs.push(job);
    }
  }
  
  logger.info(`\n=== Combination Summary ===`);
  logger.info(`Total jobs loaded: ${totalLoaded}`);
  logger.info(`Duplicates removed: ${duplicatesRemoved}`);
  logger.info(`Unique jobs: ${allJobs.length}`);
  
  // Breakdown by source
  const sourceStats = {};
  for (const job of allJobs) {
    const source = job.site || 'unknown';
    sourceStats[source] = (sourceStats[source] || 0) + 1;
  }
  
  logger.info(`\nJobs by source:`);
  for (const [source, count] of Object.entries(sourceStats).sort((a, b) => b[1] - a[1])) {
    logger.info(`  ${source}: ${count}`);
  }
  logger.info(`===========================\n`);
  
  // Save combined results
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allJobs, null, 2));
    logger.info(`✅ Saved ${allJobs.length} jobs to ${OUTPUT_FILE}`);
    return { success: true, jobCount: allJobs.length };
  } catch (error) {
    logger.error(`Failed to save combined results: ${error.message}`);
    return { success: false, jobCount: 0, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  const result = combineResults();
  process.exit(result.success ? 0 : 1);
}

module.exports = { combineResults };

