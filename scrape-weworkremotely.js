// Import required modules
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const xml2js = require('xml2js');

// Configuration
const WWR_RSS_URL = 'https://weworkremotely.com/remote-jobs.rss';
const RESULTS_FILE = path.join(__dirname, 'weworkremotely-results.json');
const KEYWORDS = [
  'data entry',
  'administrative',
  'assistant',
  'virtual assistant',
  'customer service',
  'support'
];

// Configure logger
const logger = {
  debug: (...args) => console.debug(`DEBUG: ${args.join(' ')}`),
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`)
};

// Configure axios
const axiosClient = axios.create({
  timeout: 30000, // 30 second timeout
  headers: {
    'Accept': 'application/xml, text/xml, */*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

// Helper function to extract job details from RSS item
function extractJobDetails(item) {
  try {
    const title = item.title?.[0] || '';
    const link = item.link?.[0] || '';
    const description = item.description?.[0] || '';
    const pubDate = item.pubDate?.[0] || '';
    
    // Create a job object structure similar to JobSpy output
    return {
      title,
      company_name: extractCompanyName(title, description),
      location: 'Remote',
      job_type: 'N/A',
      date_posted: new Date(pubDate).toISOString(),
      job_url: link,
      description,
      is_remote: true,
      search_query: 'weworkremotely-rss',
      site_source: 'weworkremotely'
    };
  } catch (error) {
    logger.error(`Error extracting job details: ${error.message}`);
    return null;
  }
}

// Helper function to extract company name from title or description
function extractCompanyName(title, description) {
  // Try to extract company from "CompanyName: Job Title" format
  const titleMatch = title.match(/^([^:]+):/);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  
  // If no match in title, return "WeWorkRemotely Job"
  return "WeWorkRemotely Job";
}

// Function to check if a job matches our keywords
function matchesKeywords(job) {
  const text = `${job.title} ${job.description}`.toLowerCase();
  return KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
}

// Main function
async function main() {
  console.log(`Starting WeWorkRemotely RSS Scraper at ${new Date().toUTCString()}`);
  logger.info('Starting WeWorkRemotely RSS scraping operation');
  
  try {
    // Fetch RSS feed
    logger.info(`Fetching RSS feed from ${WWR_RSS_URL}`);
    const response = await axiosClient.get(WWR_RSS_URL);
    
    if (!response.data) {
      throw new Error('Empty response from WeWorkRemotely RSS feed');
    }
    
    // Parse XML to JSON
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(response.data);
    
    if (!result || !result.rss || !result.rss.channel || !result.rss.channel[0].item) {
      throw new Error('Invalid RSS feed format');
    }
    
    const items = result.rss.channel[0].item;
    logger.info(`Found ${items.length} jobs in RSS feed`);
    
    // Extract job details
    const allJobs = [];
    let matchedJobsCount = 0;
    
    for (const item of items) {
      const job = extractJobDetails(item);
      if (job) {
        allJobs.push(job);
        
        // Check if job matches our keywords
        if (matchesKeywords(job)) {
          matchedJobsCount++;
        }
      }
    }
    
    // Filter jobs that match our keywords
    const filteredJobs = allJobs.filter(matchesKeywords);
    
    // Save all jobs to file
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(filteredJobs, null, 2));
    logger.info(`Results saved to ${RESULTS_FILE}`);
    
    // Summary
    logger.info(`Scraping complete!`);
    logger.info(`Total jobs found in RSS feed: ${allJobs.length}`);
    logger.info(`Jobs matching keywords: ${filteredJobs.length}`);
    
  } catch (error) {
    logger.error(`Error scraping WeWorkRemotely RSS: ${error.message}`);
    if (error.response) {
      logger.error(`Response status: ${error.response.status}`);
    }
  }
  
  console.log(`WeWorkRemotely RSS Scraper completed at ${new Date().toUTCString()}`);
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error in main: ${error.message}`);
  process.exit(1);
}); 