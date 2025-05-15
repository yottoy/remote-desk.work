// Import required modules
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

// Configuration
const RESULTS_FILE = path.join(__dirname, 'weworkremotely-results.json');
const WWR_RSS_URL = 'https://weworkremotely.com/remote-jobs.rss';
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:90.0) Gecko/20100101 Firefox/90.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
];

// Configure logger
const logger = {
  debug: (...args) => console.debug(`DEBUG: ${args.join(' ')}`),
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`)
};

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get a random user agent
const getRandomUserAgent = () => {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

// Helper function to get a random delay between min and max milliseconds
const getRandomDelay = (min = 3000, max = 8000) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Function to scrape WeWorkRemotely RSS feed
async function scrapeWWR(retryCount = 0, maxRetries = 3) {
  try {
    logger.info(`Fetching RSS feed from ${WWR_RSS_URL}`);
    
    // Add randomized delay to avoid being blocked
    const randomDelay = getRandomDelay();
    logger.debug(`Adding ${randomDelay}ms delay before request`);
    await delay(randomDelay);
    
    // Configure axios with necessary headers to avoid being blocked
    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://weworkremotely.com/',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    const response = await axios.get(WWR_RSS_URL, {
      headers,
      timeout: 30000,
      maxRedirects: 5
    });
    
    if (response.status !== 200) {
      throw new Error(`Response status: ${response.status}`);
    }
    
    // Log success and parse XML
    logger.info('Successfully fetched RSS feed, parsing XML');
    const xmlData = response.data;
    
    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "_", 
      isArray: (name) => ['item'].includes(name)
    });
    
    const rssData = parser.parse(xmlData);
    
    // Extract job data from parsed XML
    const channel = rssData.rss?.channel;
    if (!channel) {
      logger.warn('RSS feed format is not as expected, no channel found');
      return [];
    }
    
    const items = channel.item || [];
    logger.info(`Found ${items.length} items in RSS feed`);
    
    // Convert RSS items to job objects
    const jobs = items.map(item => {
      const title = item.title || '';
      const link = item.link || '';
      const pubDate = item.pubDate || '';
      const description = item.description || '';
      
      // Parse company and location from title (format usually: "Company: Job Title (Location)")
      let company = '';
      let location = 'Remote';
      
      if (title.includes(':')) {
        company = title.split(':')[0].trim();
      }
      
      // Extract category (job type)
      const category = item.category || 'Unknown';
      
      // Convert to common job format
      return {
        title: title.replace(/^.*?: /, '').replace(/ \(.*?\)$/, '').trim(), // Remove company and location
        job_url: link,
        company: company,
        location: location,
        description: description,
        post_date: new Date(pubDate).toISOString(),
        site_source: 'weworkremotely',
        job_type: category,
        is_remote: true
      };
    });
    
    // Filter for admin and data entry jobs only
    const adminKeywords = [
      'administrative', 'admin', 'assistant', 'data entry', 'clerk', 
      'receptionist', 'secretary', 'coordinator', 'customer service', 'virtual',
      'office', 'clerical', 'typing', 'transcription'
    ];
    
    const adminJobs = jobs.filter(job => {
      const title = job.title.toLowerCase();
      const description = job.description.toLowerCase();
      
      return adminKeywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      );
    });
    
    logger.info(`Filtered to ${adminJobs.length} admin/data entry jobs out of ${jobs.length} total jobs`);
    
    return adminJobs;
    
  } catch (error) {
    logger.error(`Error scraping WeWorkRemotely RSS: ${error.message}`);
    
    // Log detailed error for debugging
    if (error.response) {
      logger.error(`Response status: ${error.response.status}`);
      
      // If we're being blocked (403 Forbidden)
      if (error.response.status === 403) {
        logger.warn('Received 403 Forbidden - site may be blocking scraping attempts');
        
        // Retry with a longer delay if not exceeding max retries
        if (retryCount < maxRetries) {
          const retryDelay = getRandomDelay(10000, 20000); // Longer delay for retries
          logger.info(`Retrying in ${retryDelay/1000} seconds (attempt ${retryCount + 1}/${maxRetries})...`);
          await delay(retryDelay);
          return scrapeWWR(retryCount + 1, maxRetries);
        }
      }
    }
    
    return [];
  }
}

// Main function
async function main() {
  console.log(`Starting WeWorkRemotely RSS Scraper at ${new Date().toUTCString()}`);
  logger.info('Starting WeWorkRemotely RSS scraping operation');
  
  try {
    // Scrape WeWorkRemotely RSS feed
    const jobs = await scrapeWWR();
    
    // Save results to file
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(jobs, null, 2));
    logger.info(`Saved ${jobs.length} jobs to ${RESULTS_FILE}`);
    
    console.log(`WeWorkRemotely RSS Scraper completed at ${new Date().toUTCString()}`);
  } catch (error) {
    logger.error(`Unhandled error in main: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error in main: ${error.message}`);
  process.exit(1);
}); 