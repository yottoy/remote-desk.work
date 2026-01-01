#!/usr/bin/env node
/**
 * RemoteOK Job Scraper
 * 
 * Scrapes remote jobs from RemoteOK.com API
 * API: https://remoteok.com/api
 * No authentication required
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const RESULTS_FILE = path.join(__dirname, 'remoteok-results.json');
const API_URL = 'https://remoteok.com/api';
const USER_AGENT = 'ClickClickJob Bot 1.0 (Remote Job Aggregator)';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Target tags for admin/data entry jobs
const TARGET_TAGS = [
  'admin',
  'support',
  'customer-service',
  'data',
  'virtual-assistant',
  'entry-level'
];

// Keywords for filtering relevant jobs
const RELEVANT_KEYWORDS = [
  'admin', 'administrative', 'assistant', 'data entry', 'data processing',
  'customer service', 'customer support', 'virtual assistant', 'receptionist',
  'clerk', 'secretary', 'office', 'clerical', 'typing', 'transcription',
  'support specialist', 'help desk', 'back office', 'operations'
];

// Scam/spam detection keywords
const SCAM_KEYWORDS = [
  'mlm', 'multi level marketing', 'pyramid', 'investment required',
  'pay to work', 'upfront fee', '$1000/day', '$5000/week', 'get rich quick',
  'work from phone', 'no experience $', 'guaranteed income'
];

// Logger
const logger = {
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`),
  debug: (...args) => console.debug(`DEBUG: ${args.join(' ')}`)
};

/**
 * Check if job is relevant based on title and description
 */
function isRelevantJob(job) {
  const searchText = `${job.position || ''} ${job.description || ''}`.toLowerCase();
  
  // Check for scam keywords
  const hasScamKeywords = SCAM_KEYWORDS.some(keyword => searchText.includes(keyword.toLowerCase()));
  if (hasScamKeywords) {
    logger.debug(`Filtered out scam job: ${job.position}`);
    return false;
  }
  
  // Check for relevant keywords
  const isRelevant = RELEVANT_KEYWORDS.some(keyword => searchText.includes(keyword.toLowerCase()));
  
  return isRelevant;
}

/**
 * Map RemoteOK job to our schema
 */
function mapJobToSchema(job) {
  // Parse salary if available
  let salaryMin = null;
  let salaryMax = null;
  let salaryCurrency = 'USD';
  
  if (job.salary_min) {
    salaryMin = parseInt(job.salary_min);
  }
  if (job.salary_max) {
    salaryMax = parseInt(job.salary_max);
  }
  
  // Build job URL
  const jobUrl = job.url || `https://remoteok.com/remote-jobs/${job.slug || job.id}`;
  
  // Parse date
  let datePosted = new Date();
  if (job.date) {
    datePosted = new Date(job.date);
  } else if (job.epoch) {
    datePosted = new Date(job.epoch * 1000);
  }
  
  // Determine job type
  let jobType = 'full-time';
  const positionLower = (job.position || '').toLowerCase();
  if (positionLower.includes('part-time') || positionLower.includes('part time')) {
    jobType = 'part-time';
  } else if (positionLower.includes('contract') || positionLower.includes('freelance')) {
    jobType = 'contract';
  }
  
  return {
    title: job.position || 'Remote Position',
    company: job.company || 'Unknown Company',
    location: job.location || 'Remote',
    description: job.description || '',
    job_url: jobUrl,
    date_posted: datePosted,
    site: 'remoteok',
    job_type: jobType,
    is_remote: true,
    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: salaryCurrency,
    tags: job.tags || [],
    logo: job.company_logo || null,
    apply_url: job.apply_url || jobUrl
  };
}

/**
 * Fetch jobs from RemoteOK API
 */
async function fetchRemoteOKJobs() {
  try {
    logger.info('Fetching jobs from RemoteOK API...');
    
    const response = await axios.get(API_URL, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });
    
    if (!response.data || !Array.isArray(response.data)) {
      logger.error('Invalid API response format');
      return [];
    }
    
    // First element is metadata, skip it
    const jobs = response.data.slice(1);
    
    logger.info(`Received ${jobs.length} jobs from RemoteOK`);
    
    return jobs;
    
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      logger.error('Request timeout - RemoteOK API did not respond');
    } else if (error.response) {
      logger.error(`API error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      logger.error('No response from RemoteOK API');
    } else {
      logger.error(`Error fetching jobs: ${error.message}`);
    }
    return [];
  }
}

/**
 * Main scraping function
 */
async function scrapeRemoteOK() {
  const startTime = Date.now();
  logger.info('Starting RemoteOK scraper');
  
  try {
    // Fetch all jobs
    const allJobs = await fetchRemoteOKJobs();
    
    if (allJobs.length === 0) {
      logger.warn('No jobs fetched from RemoteOK');
      fs.writeFileSync(RESULTS_FILE, JSON.stringify([], null, 2));
      return { success: false, jobsFound: 0, errors: ['No jobs fetched'] };
    }
    
    // Filter for relevant jobs
    logger.info('Filtering for relevant admin/support/data entry jobs...');
    const relevantJobs = allJobs.filter(isRelevantJob);
    
    logger.info(`Found ${relevantJobs.length} relevant jobs out of ${allJobs.length} total`);
    
    // Map to our schema
    const mappedJobs = relevantJobs.map(mapJobToSchema);
    
    // Remove duplicates by URL
    const uniqueJobs = [];
    const seenUrls = new Set();
    
    for (const job of mappedJobs) {
      if (!seenUrls.has(job.job_url)) {
        seenUrls.add(job.job_url);
        uniqueJobs.push(job);
      }
    }
    
    logger.info(`${uniqueJobs.length} unique jobs after deduplication`);
    
    // Save results
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(uniqueJobs, null, 2));
    logger.info(`Saved ${uniqueJobs.length} jobs to ${RESULTS_FILE}`);
    
    // Summary stats
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const stats = {
      success: true,
      jobsFound: uniqueJobs.length,
      totalScraped: allJobs.length,
      filtered: allJobs.length - relevantJobs.length,
      duplicates: relevantJobs.length - uniqueJobs.length,
      duration: `${duration}s`,
      timestamp: new Date().toISOString()
    };
    
    logger.info('=== RemoteOK Scraper Summary ===');
    logger.info(`Total jobs received: ${stats.totalScraped}`);
    logger.info(`Relevant jobs: ${relevantJobs.length}`);
    logger.info(`Filtered out: ${stats.filtered}`);
    logger.info(`Duplicates removed: ${stats.duplicates}`);
    logger.info(`Final unique jobs: ${stats.jobsFound}`);
    logger.info(`Duration: ${stats.duration}`);
    logger.info('================================');
    
    return stats;
    
  } catch (error) {
    logger.error(`Scraper failed: ${error.message}`);
    
    // Create empty results file with error info
    const errorResult = {
      error: error.message,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(RESULTS_FILE, JSON.stringify([], null, 2));
    
    return {
      success: false,
      jobsFound: 0,
      errors: [error.message]
    };
  }
}

// Run scraper if called directly
if (require.main === module) {
  scrapeRemoteOK()
    .then(stats => {
      if (stats.success) {
        logger.info('✅ RemoteOK scraper completed successfully');
        process.exit(0);
      } else {
        logger.error('❌ RemoteOK scraper failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { scrapeRemoteOK };

