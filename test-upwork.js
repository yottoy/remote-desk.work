require('dotenv').config();
const UpworkScraper = require('./remote-job-scraper/src/scrapers/UpworkScraper');
const path = require('path');

async function testUpworkScraper() {
  console.log('Testing Upwork scraper...');
  console.log('Current directory:', process.cwd());
  
  // Process the environment variables
  console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
  
  const scraper = new UpworkScraper();
  
  try {
    const jobs = await scraper.scrape();
    console.log(`Found ${jobs.length} jobs from Upwork`);
    
    if (jobs.length > 0) {
      console.log('\nSample job:');
      console.log(JSON.stringify(jobs[0], null, 2));
    }
  } catch (error) {
    console.error('Error testing Upwork scraper:', error);
  }
}

testUpworkScraper().catch(console.error); 