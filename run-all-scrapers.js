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
    // Resolve script path to absolute path
    const absolutePath = path.resolve(__dirname, scriptPath);
    
    // Check if script exists
    if (!fs.existsSync(absolutePath)) {
      return reject(new Error(`Script not found: ${absolutePath}`));
    }
    
    logger.info(`Running script: ${absolutePath}`);
    
    // Get file extension to determine how to run it
    const ext = path.extname(absolutePath);
    let child;
    
    if (ext === '.js') {
      // Run JavaScript file using Node.js
      child = spawn('node', [absolutePath], {
        stdio: 'inherit',
        shell: true
      });
    } else if (ext === '.py') {
      // Run Python file
      child = spawn('python3', [absolutePath], {
        stdio: 'inherit',
        shell: true
      });
    } else {
      return reject(new Error(`Unsupported script type: ${ext}`));
    }
    
    // Handle exit
    child.on('close', (code) => {
      if (code === 0) {
        logger.info(`Script ${scriptPath} completed successfully`);
        resolve();
      } else {
        logger.warn(`Script ${scriptPath} exited with code ${code}`);
        resolve(); // Resolve anyway so we can continue with other scripts
      }
    });
    
    // Handle errors
    child.on('error', (err) => {
      logger.error(`Error running script ${scriptPath}: ${err.message}`);
      resolve(); // Resolve anyway so we can continue with other scripts
    });
  });
}

// Helper function to count jobs in a result file
function countJobsInFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      logger.info(`File not found: ${filePath}`);
      return 0;
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);
    
    // Handle different result formats
    if (Array.isArray(json)) {
      logger.info(`Found ${json.length} jobs in ${filePath}`);
      return json.length;
    } else if (json.jobs && Array.isArray(json.jobs)) {
      logger.info(`Found ${json.jobs.length} jobs in ${filePath}`);
      return json.jobs.length;
    } else if (json.total_jobs) {
      logger.info(`Found ${json.total_jobs} jobs in ${filePath}`);
      return json.total_jobs;
    } else {
      logger.info(`No jobs found in ${filePath}`);
      return 0;
    }
  } catch (err) {
    logger.error(`Error reading jobs from ${filePath}: ${err.message}`);
    return 0;
  }
}

// Helper function to combine all results
function combineResults() {
  try {
    logger.info('Combining results from all scrapers...');
    
    const resultFiles = [
      path.join(__dirname, 'indeed-results.json'),
      path.join(__dirname, 'scrape-results.json'),
      path.join(__dirname, 'alt-sites-results.json'),
      path.join(__dirname, 'weworkremotely-results.json'),
      path.join(__dirname, 'results', 'combined-results.json')
    ];
    
    let allJobs = [];
    
    // Process each result file
    for (const filePath of resultFiles) {
      try {
        if (!fs.existsSync(filePath)) {
          continue;
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(data);
        
        // Handle different result formats
        if (Array.isArray(json)) {
          logger.info(`Read ${json.length} jobs from ${filePath}`);
          allJobs = allJobs.concat(json);
        } else if (json.jobs && Array.isArray(json.jobs)) {
          logger.info(`Read ${json.jobs.length} jobs from ${filePath}`);
          allJobs = allJobs.concat(json.jobs);
        } else {
          logger.info(`Skipping ${filePath} (incompatible format)`);
        }
      } catch (err) {
        logger.error(`Error reading ${filePath}: ${err.message}`);
      }
    }
    
    // Remove duplicate jobs based on job URL
    const uniqueJobs = [];
    const seenUrls = new Set();
    
    for (const job of allJobs) {
      const url = job.job_url || job.url;
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        uniqueJobs.push(job);
      }
    }
    
    logger.info(`Combined ${allJobs.length} jobs into ${uniqueJobs.length} unique jobs`);
    
    // Save combined results
    fs.writeFileSync(COMBINED_RESULTS_FILE, JSON.stringify(uniqueJobs, null, 2));
    logger.info(`Saved combined results to ${COMBINED_RESULTS_FILE}`);
    
    return uniqueJobs.length;
  } catch (err) {
    logger.error(`Error combining results: ${err.message}`);
    return 0;
  }
}

// Run all scrapers in sequence
async function main() {
  console.log(`All Scrapers Runner started at ${new Date().toUTCString()}`);
  
  try {
    // First try traditional scrapers, but don't stop if they fail
    try {
      // Direct Python scraper first, since it's most reliable
      await runScript('run-jobspy-direct.js');
      
      // Check if the direct scraper found any jobs
      const directJobs = countJobsInFile(path.join(__dirname, 'results', 'combined-results.json'));
      
      if (directJobs > 0) {
        logger.info(`Direct scraper found ${directJobs} jobs`);
        
        // Copy results to standard location for compatibility
        try {
          fs.copyFileSync(
            path.join(__dirname, 'results', 'scrape-results.json'),
            path.join(__dirname, 'scrape-results.json')
          );
          logger.info(`Copied ${directJobs} jobs from direct scraper to ${path.join(__dirname, 'scrape-results.json')}`);
        } catch (copyErr) {
          logger.error(`Error copying direct scraper results: ${copyErr.message}`);
        }
      } else {
        // If direct scraper failed, try traditional scrapers
        logger.info('Direct scraper found no jobs, trying traditional scrapers');
        
        // Run traditional JobSpy bridge scraper (but don't fail if it fails)
        try {
          await runScript('scrape-all-jobs.js');
        } catch (e) {
          logger.error(`Error running scrape-all-jobs.js: ${e.message}`);
        }
        
        // Try alternative sites scraper
        try {
          await runScript('scrape-alt-sites.js');
        } catch (e) {
          logger.error(`Error running scrape-alt-sites.js: ${e.message}`);
        }
        
        // Try WeWorkRemotely scraper
        try {
          await runScript('scrape-weworkremotely.js');
        } catch (e) {
          logger.error(`Error running scrape-weworkremotely.js: ${e.message}`);
        }
      }
    } catch (e) {
      logger.error(`Error in main scraping sequence: ${e.message}`);
    }
    
    // Check if we have any jobs at all
    logger.info('Checking for previous scraping results...');
    const indeedJobs = countJobsInFile(path.join(__dirname, 'indeed-results.json'));
    const scrapeJobs = countJobsInFile(path.join(__dirname, 'scrape-results.json'));
    const altJobs = countJobsInFile(path.join(__dirname, 'alt-sites-results.json'));
    const wwrJobs = countJobsInFile(path.join(__dirname, 'weworkremotely-results.json'));
    const directJobs = countJobsInFile(path.join(__dirname, 'results', 'combined-results.json'));
    
    const totalJobs = indeedJobs + scrapeJobs + altJobs + wwrJobs + directJobs;
    logger.info(`Found a total of ${totalJobs} jobs in existing results`);
    
    // If we have no jobs, run the direct Python scraper as a fallback
    if (totalJobs === 0 && directJobs === 0) {
      logger.info('No jobs found with traditional scrapers, trying direct Python scraper as fallback');
      try {
        await runScript('direct_scraper.py');
        
        // Check if the fallback found any jobs
        const fallbackJobs = countJobsInFile(path.join(__dirname, 'results', 'combined-results.json'));
        if (fallbackJobs > 0) {
          logger.info(`Fallback direct Python scraper found ${fallbackJobs} jobs`);
          
          // Copy results to standard location for compatibility
          try {
            fs.copyFileSync(
              path.join(__dirname, 'results', 'combined-results.json'),
              path.join(__dirname, 'scrape-results.json')
            );
            logger.info(`Copied ${fallbackJobs} jobs from fallback scraper to ${path.join(__dirname, 'scrape-results.json')}`);
          } catch (copyErr) {
            logger.error(`Error copying fallback scraper results: ${copyErr.message}`);
          }
        }
      } catch (e) {
        logger.error(`Error running direct_scraper.py: ${e.message}`);
      }
    }
    
    // Combine all results
    if (COMBINE_RESULTS) {
      const combinedCount = combineResults();
      if (combinedCount === 0) {
        logger.warn('No jobs found in any scraper!');
      }
    }
    
  } catch (err) {
    logger.error(`Unhandled error: ${err.message}`);
  }
  
  console.log(`All Scrapers Runner completed at ${new Date().toUTCString()}`);
}

// Run the main function
main(); 