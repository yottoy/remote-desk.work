// Node.js bridge to execute the direct Python scraper
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

// Function to execute the Python scraper
function executeDirectScraper() {
  return new Promise((resolve, reject) => {
    logger.info('Starting direct JobSpy Python scraper...');
    
    // Ensure script exists
    const scriptPath = path.join(__dirname, 'direct_scraper.py');
    if (!fs.existsSync(scriptPath)) {
      return reject(new Error(`Script not found: ${scriptPath}`));
    }
    
    // Make sure the script is executable
    try {
      fs.chmodSync(scriptPath, '755');
      logger.info(`Made script executable: ${scriptPath}`);
    } catch (err) {
      logger.warn(`Could not make script executable: ${err.message}`);
    }
    
    // Execute the Python script
    const pythonProcess = spawn('python3', [scriptPath], {
      stdio: 'inherit',
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });
    
    // Handle completion
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        logger.info('Python script completed successfully');
        
        // Check if results were generated
        const resultsFile = path.join(__dirname, 'results', 'combined-results.json');
        try {
          if (fs.existsSync(resultsFile)) {
            const data = fs.readFileSync(resultsFile, 'utf8');
            const results = JSON.parse(data);
            const jobCount = results.jobs ? results.jobs.length : (Array.isArray(results) ? results.length : 0);
            logger.info(`Found ${jobCount} jobs`);
            resolve(jobCount);
          } else {
            logger.warn('No results file was created');
            resolve(0);
          }
        } catch (err) {
          logger.error(`Error processing results: ${err.message}`);
          resolve(0);
        }
      } else {
        logger.error(`Python process exited with code ${code}`);
        resolve(0);
      }
    });
    
    // Handle errors
    pythonProcess.on('error', (err) => {
      logger.error(`Error executing Python script: ${err.message}`);
      reject(err);
    });
  });
}

// Main function
async function main() {
  console.log(`INFO: Starting JobSpy Direct Scraper Bridge at ${new Date().toUTCString()}`);
  
  try {
    const jobCount = await executeDirectScraper();
    
    if (jobCount > 0) {
      // Copy results to the standard location for compatibility
      try {
        const sourceFile = path.join(__dirname, 'results', 'combined-results.json');
        const targetFile = path.join(__dirname, 'scrape-results.json');
        
        fs.copyFileSync(sourceFile, targetFile);
        logger.info(`Copied results to ${targetFile}`);
      } catch (err) {
        logger.error(`Error copying results: ${err.message}`);
      }
    } else {
      logger.warn('No jobs found, creating empty results file');
      const emptyResults = {
        scrape_date: new Date().toISOString(),
        total_jobs: 0,
        jobs: []
      };
      
      fs.writeFileSync(
        path.join(__dirname, 'scrape-results.json'), 
        JSON.stringify(emptyResults, null, 2)
      );
    }
    
    logger.info('Direct scraper completed');
    process.exit(0);
  } catch (err) {
    logger.error(`Unhandled error: ${err.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 