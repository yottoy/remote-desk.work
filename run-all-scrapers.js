// Import required modules
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configure logger
const logger = {
  debug: (...args) => console.debug(`DEBUG: ${args.join(' ')}`),
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`)
};

// Configuration
const COMBINE_RESULTS = true;
const COMBINED_RESULTS_FILE = path.join(__dirname, 'combined-results.json');

// Helper function to run a script and wait for it to complete
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    logger.info(`Running script: ${scriptPath}`);
    
    const process = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        logger.info(`Script ${scriptPath} completed successfully`);
        resolve();
      } else {
        logger.warn(`Script ${scriptPath} exited with code ${code}`);
        resolve(); // Still continue even if script fails
      }
    });
    
    process.on('error', (err) => {
      logger.error(`Failed to start script ${scriptPath}: ${err.message}`);
      resolve(); // Still continue even if script fails
    });
  });
}

// Function to read JSON file
function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    logger.error(`Error reading file ${filePath}: ${error.message}`);
  }
  return [];
}

// Function to combine all results into one file
function combineResults() {
  try {
    logger.info('Combining results from all scrapers...');
    
    // List of result files to combine
    const resultFiles = [
      path.join(__dirname, 'scrape-results.json'),         // Original JobSpy results
      path.join(__dirname, 'alt-sites-results.json'),      // Alternative sites results
      path.join(__dirname, 'weworkremotely-results.json')  // WeWorkRemotely results
    ];
    
    // Aggregate all jobs
    const allJobs = [];
    let uniqueJobUrls = new Set();
    
    // Process each result file
    for (const file of resultFiles) {
      const jobs = readJsonFile(file);
      logger.info(`Read ${jobs.length} jobs from ${file}`);
      
      // Add only jobs with unique URLs
      for (const job of jobs) {
        if (job.job_url && !uniqueJobUrls.has(job.job_url)) {
          uniqueJobUrls.add(job.job_url);
          allJobs.push(job);
        }
      }
    }
    
    // Save combined results
    fs.writeFileSync(COMBINED_RESULTS_FILE, JSON.stringify(allJobs, null, 2));
    logger.info(`Combined ${allJobs.length} unique jobs into ${COMBINED_RESULTS_FILE}`);
    
    // Statistics
    const siteCounts = {};
    for (const job of allJobs) {
      const site = job.site_source || 'unknown';
      siteCounts[site] = (siteCounts[site] || 0) + 1;
    }
    
    logger.info('Job counts by site:');
    for (const [site, count] of Object.entries(siteCounts)) {
      logger.info(`  ${site}: ${count} jobs`);
    }
    
  } catch (error) {
    logger.error(`Error combining results: ${error.message}`);
  }
}

// Main function
async function main() {
  console.log(`Starting All Scrapers Runner at ${new Date().toUTCString()}`);
  
  try {
    // Check that the bridge is running
    logger.info('Make sure the JobSpy bridge is running (python3 jobspy_bridge.py)');
    
    // List of scripts to run
    const scripts = [
      './scrape-all-jobs.js',       // Original JobSpy script
      './scrape-alt-sites.js',      // Alternative sites script
      './scrape-weworkremotely.js'  // WeWorkRemotely script
    ];
    
    // Run each script sequentially
    for (const script of scripts) {
      await runScript(script);
    }
    
    // Combine results if enabled
    if (COMBINE_RESULTS) {
      combineResults();
    }
    
    console.log(`All Scrapers Runner completed at ${new Date().toUTCString()}`);
    
  } catch (error) {
    logger.error(`Unhandled error in main: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 