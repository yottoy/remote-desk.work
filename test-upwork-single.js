require('dotenv').config();
const { chromium } = require('playwright');

// Configuration
const config = {
  upwork: {
    baseUrl: 'https://www.upwork.com',
    searches: ['data entry remote'],
    filters: {
      hourlyRate: 'hourly',
      jobType: 'fixed',
      experience: 'entry',
      duration: 'ongoing'
    }
  },
  scraping: {
    concurrency: 1,
    rateLimitMs: 15000,
    retries: 3, 
    timeout: 60000,
    headless: false,
    slowMo: 150
  }
};

// Simplified scrape function
async function scrapeUpwork() {
  console.log('Starting Upwork test scraper');
  
  const browser = await chromium.launch({
    headless: config.scraping.headless,
    slowMo: config.scraping.slowMo
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  const jobs = [];
  
  try {
    // Scrape first search term
    const searchTerm = config.upwork.searches[0];
    console.log(`Scraping search: ${searchTerm}`);
    
    // Construct search URL
    const encodedSearch = encodeURIComponent(searchTerm);
    let url = `${config.upwork.baseUrl}/search/jobs?q=${encodedSearch}&sort=recency`;
    
    console.log(`Navigating to: ${url}`);
    
    // Navigate to URL
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: config.scraping.timeout
    });
    
    // Wait for job listings to load
    console.log('Waiting for job listings to load');
    try {
      await page.waitForSelector('[data-test="job-tile-list"]', { timeout: 60000 });
    } catch (e) {
      console.log('Could not find job listing container, checking if we need to handle cookies or login');
      
      // Try to handle cookie consent
      try {
        const cookieButton = await page.$('[id*="cookie"] button, [class*="cookie"] button, button[id*="accept"], button[class*="accept"]');
        if (cookieButton) {
          console.log('Found cookie consent button, clicking it');
          await cookieButton.click();
        }
      } catch (e) {
        console.log('No cookie consent found or error handling it');
      }
      
      // Wait for manual interaction if needed
      console.log('Waiting 60 seconds for any manual interaction needed (login, captcha, etc)');
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      console.log('Trying again to find job listings');
      await page.waitForSelector('[data-test="job-tile-list"]', { timeout: 60000 });
    }
    
    // Get all job listings
    const jobElements = await page.$$('[data-test="job-tile"]');
    console.log(`Found ${jobElements.length} job listings`);
    
    // Only process first 2 jobs for testing
    const jobsToProcess = jobElements.slice(0, 2);
    
    // Process each job
    for (const jobElement of jobsToProcess) {
      try {
        // Extract job data
        const titleElement = await jobElement.$('[data-test="job-title-link"]');
        if (!titleElement) {
          console.log('Skipping job with missing title');
          continue;
        }
        
        const title = await titleElement.textContent().then(text => text.trim());
        const url = await titleElement.getAttribute('href');
        
        // Get company name (client name)
        const companyElement = await jobElement.$('[data-test="client-info"]');
        const company = companyElement 
          ? await companyElement.textContent().then(text => text.trim()) 
          : 'Upwork Client';
        
        // Get job description
        const descElement = await jobElement.$('[data-test="job-description"]');
        const description = descElement 
          ? await descElement.textContent().then(text => text.trim())
          : '';
        
        // Create job object
        const job = {
          title,
          company,
          url: url.startsWith('http') ? url : `${config.upwork.baseUrl}${url}`,
          description,
          source: 'upwork'
        };
        
        jobs.push(job);
        console.log(`Scraped job: ${job.title}`);
      } catch (error) {
        console.error(`Error processing job: ${error.message}`);
        continue;
      }
    }
  } catch (error) {
    console.error(`Error in Upwork scraper: ${error.message}`);
  } finally {
    // Close browser
    await browser.close();
  }
  
  return jobs;
}

// Run the scraper
async function main() {
  try {
    const jobs = await scrapeUpwork();
    console.log(`Found ${jobs.length} jobs from Upwork`);
    
    if (jobs.length > 0) {
      console.log('\nSample job:');
      console.log(JSON.stringify(jobs[0], null, 2));
    }
  } catch (error) {
    console.error('Error running scraper:', error);
  }
}

main(); 