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
      logger.warn(`Script ${absolutePath} not found. Skipping.`);
      resolve();
      return;
    }
    
    logger.info(`Running script: ${absolutePath}`);
    
    try {
      const process = spawn('node', [absolutePath], {
        stdio: 'inherit',
        shell: true
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          logger.info(`Script ${scriptPath} completed successfully`);
          resolve();
        } else {
          logger.warn(`Script ${scriptPath} exited with code ${code}`);
          // Continue execution even if script fails
          resolve();
        }
      });
      
      process.on('error', (err) => {
        logger.error(`Failed to start script ${scriptPath}: ${err.message}`);
        // Continue execution even if script fails
        resolve();
      });
    } catch (error) {
      logger.error(`Error running script ${scriptPath}: ${error.message}`);
      // Continue execution even if script fails
      resolve();
    }
  });
}

// Function to read JSON file
function readJsonFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      try {
        return JSON.parse(data);
      } catch (parseError) {
        logger.error(`Error parsing JSON from ${filePath}: ${parseError.message}`);
        return [];
      }
    } else {
      logger.warn(`File not found: ${filePath}. Returning empty array.`);
      return [];
    }
  } catch (error) {
    logger.error(`Error reading file ${filePath}: ${error.message}`);
    return [];
  }
}

// Function to combine all results into one file
function combineResults() {
  try {
    logger.info('Combining results from all scrapers...');
    
    // List of result files to combine
    const resultFiles = [
      path.join(__dirname, 'indeed-results.json'),        // Indeed-specific results
      path.join(__dirname, 'scrape-results.json'),        // Original JobSpy results
      path.join(__dirname, 'alt-sites-results.json'),     // Alternative sites results
      path.join(__dirname, 'weworkremotely-results.json') // WeWorkRemotely results
    ];
    
    // Aggregate all jobs
    const allJobs = [];
    let uniqueJobUrls = new Set();
    let uniqueTitleCompanyLocPairs = new Set();
    let possibleDuplicates = [];
    
    // Tracking for deduplication metrics
    const deduplicationStats = {
      totalProcessed: 0,
      duplicateUrl: 0,
      duplicateTitleCompany: 0,
      keptWithDifferentLocation: 0,
      keptWithDifferentSalary: 0,
      addedAsUnique: 0
    };
    
    // Process each result file
    for (const file of resultFiles) {
      const jobs = readJsonFile(file);
      logger.info(`Read ${jobs.length} jobs from ${file}`);
      
      // Track job sources for analytics
      const fileSource = path.basename(file).replace('-results.json', '');
      
      // Process each job
      for (const job of jobs) {
        deduplicationStats.totalProcessed++;
        
        // Always add source metadata
        job.source_file = fileSource;
        job.import_date = new Date().toISOString();
        
        // Create normalized fields for better matching
        const normalizedTitle = (job.title || '').toLowerCase().trim();
        const normalizedCompany = (job.company || '').toLowerCase().trim();
        const normalizedLocation = (job.location || '').toLowerCase().trim();
        
        // Create a unique key based on URL (primary deduplication method)
        const jobUrl = job.job_url || job.url || '';
        
        // Create a secondary key based on title + company + partial location (for jobs with different URLs but same content)
        // Only use first part of location to avoid over-deduplication (e.g., "Remote, USA" vs "Remote")
        const locationPrefix = normalizedLocation.split(',')[0].trim();
        const titleCompanyLocKey = `${normalizedTitle}|${normalizedCompany}|${locationPrefix}`;
        
        // Decision logic for adding jobs
        let shouldAdd = true;
        let duplicateReason = null;
        
        // If we have a job URL and it's already in our set, it's definitely a duplicate
        if (jobUrl && uniqueJobUrls.has(jobUrl)) {
          shouldAdd = false;
          duplicateReason = 'duplicate_url';
          deduplicationStats.duplicateUrl++;
        } 
        // If we have the same title+company+location combination, it's a potential duplicate
        else if (titleCompanyLocKey && uniqueTitleCompanyLocPairs.has(titleCompanyLocKey)) {
          // Before rejecting, check if it's really a duplicate or just similar listings
          // Find existing job with same title+company
          const existingJob = allJobs.find(j => 
            (j.title || '').toLowerCase().trim() === normalizedTitle && 
            (j.company || '').toLowerCase().trim() === normalizedCompany &&
            (j.location || '').toLowerCase().trim().split(',')[0] === locationPrefix
          );
          
          if (existingJob) {
            const existingLocation = (existingJob.location || '').toLowerCase().trim();
            
            // Check for meaningful differences in full location
            if (normalizedLocation && existingLocation && 
                normalizedLocation !== existingLocation && 
                !normalizedLocation.includes(existingLocation) && 
                !existingLocation.includes(normalizedLocation)) {
              
              // Likely different locations for same role - keep both
              logger.debug(`Keeping similar job with different location: ${job.title} at ${job.company} (${job.location} vs ${existingJob.location})`);
              job.possible_duplicate = true;
              job.duplicate_check = `Similar to job ID: ${existingJob.id || 'unknown'}`;
              possibleDuplicates.push(job);
              deduplicationStats.keptWithDifferentLocation++;
            } 
            // Check for salary differences
            else if (job.salary && existingJob.salary && 
                    job.salary !== existingJob.salary) {
              
              // Different salary information - might be different position or update
              logger.debug(`Keeping similar job with different salary: ${job.title} at ${job.company} (${job.salary} vs ${existingJob.salary})`);
              job.possible_duplicate = true;
              job.duplicate_check = `Similar to job ID: ${existingJob.id || 'unknown'} but different salary`;
              deduplicationStats.keptWithDifferentSalary++;
            }
            else {
              // Same title, company, and similar location - likely duplicate
              shouldAdd = false;
              duplicateReason = 'duplicate_content';
              deduplicationStats.duplicateTitleCompany++;
            }
          }
        }
        
        // Add the job if it passes our deduplication checks
        if (shouldAdd) {
          // Add to tracking sets for future comparisons
          if (jobUrl) {
            uniqueJobUrls.add(jobUrl);
          }
          if (titleCompanyLocKey) {
            uniqueTitleCompanyLocPairs.add(titleCompanyLocKey);
          }
          
          // Add job to our final list
          allJobs.push(job);
          deduplicationStats.addedAsUnique++;
        } else if (duplicateReason) {
          logger.debug(`Skipped duplicate job: ${job.title} at ${job.company} (${duplicateReason})`);
        }
      }
    }
    
    // Log duplicate stats
    logger.info(`Found ${possibleDuplicates.length} possible duplicates that were kept for different locations/salaries`);
    logger.info('Deduplication statistics:');
    logger.info(`  Total jobs processed: ${deduplicationStats.totalProcessed}`);
    logger.info(`  Duplicate URLs rejected: ${deduplicationStats.duplicateUrl} (${(deduplicationStats.duplicateUrl/deduplicationStats.totalProcessed*100).toFixed(1)}%)`);
    logger.info(`  Duplicate title+company rejected: ${deduplicationStats.duplicateTitleCompany} (${(deduplicationStats.duplicateTitleCompany/deduplicationStats.totalProcessed*100).toFixed(1)}%)`);
    logger.info(`  Kept despite similarity (different location): ${deduplicationStats.keptWithDifferentLocation} (${(deduplicationStats.keptWithDifferentLocation/deduplicationStats.totalProcessed*100).toFixed(1)}%)`);
    logger.info(`  Kept despite similarity (different salary): ${deduplicationStats.keptWithDifferentSalary} (${(deduplicationStats.keptWithDifferentSalary/deduplicationStats.totalProcessed*100).toFixed(1)}%)`);
    logger.info(`  Added as unique: ${deduplicationStats.addedAsUnique} (${(deduplicationStats.addedAsUnique/deduplicationStats.totalProcessed*100).toFixed(1)}%)`);
    
    // Save combined results
    fs.writeFileSync(COMBINED_RESULTS_FILE, JSON.stringify(allJobs, null, 2));
    logger.info(`Combined ${allJobs.length} unique jobs into ${COMBINED_RESULTS_FILE}`);
    
    // Statistics
    const siteCounts = {};
    const sourceFileCounts = {};
    
    for (const job of allJobs) {
      // Track by site source
      const site = job.site_source || 'unknown';
      siteCounts[site] = (siteCounts[site] || 0) + 1;
      
      // Track by source file
      const sourceFile = job.source_file || 'unknown';
      sourceFileCounts[sourceFile] = (sourceFileCounts[sourceFile] || 0) + 1;
    }
    
    // Log site statistics
    logger.info('Job counts by site:');
    for (const [site, count] of Object.entries(siteCounts)) {
      logger.info(`  ${site}: ${count} jobs`);
    }
    
    // Log source file statistics
    logger.info('Job counts by source file:');
    for (const [source, count] of Object.entries(sourceFileCounts)) {
      logger.info(`  ${source}: ${count} jobs`);
    }
    
    // Report on job types found - useful for refining searches
    analyzeJobTitles(allJobs);
    
  } catch (error) {
    logger.error(`Error combining results: ${error.message}`);
  }
}

// Function to analyze job titles for common patterns
function analyzeJobTitles(jobs) {
  try {
    // If no jobs, skip analysis
    if (!jobs || jobs.length === 0) {
      logger.info('No jobs to analyze');
      return;
    }
    
    // Extract primary job categories from titles
    const titleWords = {};
    const roleTypes = {};
    
    // Common admin/data entry job keywords to look for
    const adminKeywords = [
      'administrative', 'admin', 'assistant', 'data entry', 'clerk', 
      'receptionist', 'secretary', 'coordinator', 'customer service', 
      'virtual', 'remote'
    ];
    
    for (const job of jobs) {
      const title = (job.title || '').toLowerCase();
      
      // Count primary keywords in titles
      for (const keyword of adminKeywords) {
        if (title.includes(keyword)) {
          roleTypes[keyword] = (roleTypes[keyword] || 0) + 1;
        }
      }
      
      // Count all words for frequency analysis
      const words = title.split(/\s+/)
        .map(w => w.replace(/[^\w]/g, ''))
        .filter(w => w.length > 3);
      
      for (const word of words) {
        titleWords[word] = (titleWords[word] || 0) + 1;
      }
    }
    
    // Report on role types found
    logger.info('Job role types found:');
    const sortedRoles = Object.entries(roleTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [role, count] of sortedRoles) {
      const percentage = ((count / jobs.length) * 100).toFixed(1);
      logger.info(`  ${role}: ${count} jobs (${percentage}%)`);
    }
    
    // Report on common title words
    logger.info('Most common words in job titles:');
    const sortedWords = Object.entries(titleWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    
    for (const [word, count] of sortedWords) {
      const percentage = ((count / jobs.length) * 100).toFixed(1);
      logger.info(`  ${word}: ${count} occurrences (${percentage}%)`);
    }
    
  } catch (error) {
    logger.error(`Error analyzing job titles: ${error.message}`);
  }
}

// Main function
async function main() {
  console.log(`Starting All Scrapers Runner at ${new Date().toUTCString()}`);
  
  try {
    // Check that the bridge is running
    logger.info('Make sure the JobSpy bridge is running (python3 jobspy_bridge.py)');
    
    // List of scripts to run with absolute paths
    const scriptsDir = __dirname;
    const scripts = [
      path.join(scriptsDir, 'scrape-indeed.js'),      // Indeed-specific script
      path.join(scriptsDir, 'scrape-all-jobs.js'),    // Original JobSpy script
      path.join(scriptsDir, 'scrape-alt-sites.js'),   // Alternative sites script
      path.join(scriptsDir, 'scrape-weworkremotely.js') // WeWorkRemotely script
    ];
    
    // Run each script sequentially
    for (const script of scripts) {
      // Convert to relative path for logging
      const relativePath = path.relative(scriptsDir, script);
      await runScript(relativePath);
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