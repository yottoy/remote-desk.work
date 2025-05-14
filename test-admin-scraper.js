/**
 * Temporary test script for admin/data entry job scraper
 * 
 * This version tests scraping from a specific job site
 */

const AdminDataEntryScraper = require('./src/scrapers/AdminDataEntryScraper');
const database = require('./src/utils/database');
const bridgeManager = require('./src/utils/bridgeManager');
const fs = require('fs').promises;
const path = require('path');

/**
 * Main execution function
 */
async function run() {
  try {
    console.log('Starting admin/data entry job scraper test with real website data...');
    
    // Check for MongoDB URI
    if (!process.env.MONGODB_URI) {
      console.log('\n⚠️ No MongoDB URI found in environment variables.');
      console.log('Data will be stored in-memory only and not persisted.');
      console.log('To connect to MongoDB, run: node setup-mongodb.js\n');
    } else {
      console.log(`MongoDB URI found: ${process.env.MONGODB_URI.replace(/(?<=mongodb\+srv:\/\/[^:]+:)[^@]+(?=@)/, '******')}`);
    }
    
    // Connect to database
    const dbConnected = await database.connect();
    if (dbConnected && !database.useInMemory) {
      console.log('✅ Connected to MongoDB database');
    } else if (database.useInMemory) {
      console.log('⚠️ Using in-memory storage (data will not be persisted)');
    }
    
    // Check if bridge is running using the correct function
    const bridgeRunning = await bridgeManager.checkStatus();
    
    if (!bridgeRunning) {
      console.log('Starting JobSpy bridge...');
      await bridgeManager.start();
      console.log('Waiting for bridge to initialize...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
      console.log('JobSpy bridge is already running');
    }
    
    // Create scraper instance
    const scraper = new AdminDataEntryScraper();
    
    // Configure for a real website test
    console.log('Configuring scraper for a specific website test...');
    
    // Choose one source to test - options: linkedin, indeed, ziprecruiter, etc.
    const targetSource = 'indeed'; // Change this to test different sources
    console.log(`Testing source: ${targetSource}`);
    
    // Disable all sources except the target source
    Object.keys(scraper.config.sources).forEach(source => {
      scraper.config.sources[source].enabled = (source === targetSource);
      
      // If source is LinkedIn, ensure fetch_description is enabled for better data
      if (source === 'linkedin') {
        scraper.config.sources[source].fetchDescription = true;
      }
    });
    
    // Select a subset of search terms for testing
    const testAdminTerms = ['remote administrative assistant', 'virtual assistant remote'];
    const testDataEntryTerms = ['remote data entry', 'work from home data entry'];
    const testLocations = ['Remote', 'USA']; // Test common remote location specifications
    
    // Save original config for later restoration
    const adminTerms = scraper.config.adminSearchTerms;
    const dataEntryTerms = scraper.config.dataEntrySearchTerms;
    const serviceTerms = scraper.config.customerServiceSearchTerms;
    const locations = scraper.config.locations;
    
    // Apply test configuration
    scraper.config.adminSearchTerms = testAdminTerms;
    scraper.config.dataEntrySearchTerms = testDataEntryTerms;
    scraper.config.customerServiceSearchTerms = []; // Skip customer service for this test
    scraper.config.locations = testLocations;
    
    // Set reasonable result limits for testing
    scraper.config.general.resultsWanted = 10; // Limit results per search
    scraper.config.general.hoursOld = 168; // Jobs posted within the last week
    
    // Run the scraper with modified configuration
    console.log('Running admin/data entry scraper test...');
    console.log(`Search terms: ${[...testAdminTerms, ...testDataEntryTerms].join(', ')}`);
    console.log(`Locations: ${testLocations.join(', ')}`);
    
    const startTime = new Date();
    const results = await scraper.scrape();
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    // Save raw jobs data for inspection
    if (results.rawJobs && results.rawJobs.length > 0) {
      const logDir = path.join(__dirname, 'logs');
      try {
        await fs.mkdir(logDir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create logs directory: ${error.message}`);
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rawJobsFile = path.join(logDir, `raw-${targetSource}-jobs-${timestamp}.json`);
      
      await fs.writeFile(rawJobsFile, JSON.stringify(results.rawJobs, null, 2));
      console.log(`Saved raw ${targetSource} jobs to ${rawJobsFile}`);
      
      // Save filtered jobs as well for comparison
      const filteredJobsFile = path.join(logDir, `filtered-${targetSource}-jobs-${timestamp}.json`);
      await fs.writeFile(filteredJobsFile, JSON.stringify(results.jobs, null, 2));
      console.log(`Saved filtered ${targetSource} jobs to ${filteredJobsFile}`);
    }
    
    // Restore the original config
    scraper.config.adminSearchTerms = adminTerms;
    scraper.config.dataEntrySearchTerms = dataEntryTerms;
    scraper.config.customerServiceSearchTerms = serviceTerms;
    scraper.config.locations = locations;
    
    // Restore all source configurations
    Object.keys(scraper.config.sources).forEach(source => {
      if (source === 'glassdoor') {
        // Keep glassdoor disabled by default as it often has issues
        scraper.config.sources[source].enabled = false;
      } else {
        scraper.config.sources[source].enabled = true;
      }
    });
    
    // Print summary results
    console.log('\n=== Admin/Data Entry Scraper Test Results ===');
    console.log(`Source: ${targetSource}`);
    console.log(`Run completed in ${duration.toFixed(1)}s`);
    console.log(`Found: ${results.stats.totalJobs} jobs (${results.stats.adminJobsFound} admin, ${results.stats.dataEntryJobsFound} data entry, ${results.stats.customerServiceJobsFound} customer service)`);
    console.log(`Filtered out: ${results.stats.filteredOut} irrelevant jobs`);
    console.log(`Acceptance rate: ${results.jobs.length > 0 ? Math.round((results.jobs.length / results.stats.totalJobs) * 100) : 0}%`);
    
    // Display source-specific statistics
    if (results.stats.sourceStats && results.stats.sourceStats[targetSource]) {
      const sourceStats = results.stats.sourceStats[targetSource];
      console.log(`\n${targetSource.toUpperCase()} Statistics:`);
      console.log(`Total jobs found: ${sourceStats.jobsFound}`);
      
      if (sourceStats.searchTermStats) {
        console.log('\nResults by search term:');
        Object.entries(sourceStats.searchTermStats).forEach(([term, count]) => {
          console.log(`- "${term}": ${count} jobs`);
        });
      }
      
      if (sourceStats.errors > 0) {
        console.log(`\nErrors: ${sourceStats.errors}`);
      }
    }
    
    // Print sample of the jobs found
    if (results.jobs && results.jobs.length > 0) {
      console.log('\nSample of matching jobs:');
      const sampleSize = Math.min(5, results.jobs.length);
      
      for (let i = 0; i < sampleSize; i++) {
        const job = results.jobs[i];
        console.log(`\n${i+1}. ${job.title} at ${job.company}`);
        console.log(`   Category: ${job.category}, Quality Score: ${job.qualityScore}`);
        console.log(`   URL: ${job.url}`);
        console.log(`   Tags: ${job.tags.join(', ')}`);
        
        // Show a sample of the description (first 100 chars)
        const descriptionSample = job.descriptionText.substring(0, 100).replace(/\s+/g, ' ').trim();
        console.log(`   Description: ${descriptionSample}...`);
      }
    } else {
      console.log('\nNo matching jobs found in this test run');
    }
    
    // Clean exit
    console.log('\nTest completed successfully');
    
    // Return results for inspection
    return results;
  } catch (error) {
    console.error('Error running test:', error);
    throw error;
  } finally {
    // Disconnect from database
    try {
      await database.disconnect();
      console.log('Disconnected from database');
    } catch (err) {
      console.error('Error disconnecting from database:', err);
    }
  }
}

// Run the script
run()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\nTest failed:', error);
    process.exit(1);
  }); 