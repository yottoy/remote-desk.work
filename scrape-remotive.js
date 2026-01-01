#!/usr/bin/env node
/**
 * Remotive Job Scraper
 * 
 * Scrapes remote jobs from Remotive.io API
 * API: https://remotive.com/api/remote-jobs
 * No authentication required
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const RESULTS_FILE = path.join(__dirname, 'remotive-results.json');
const API_BASE_URL = 'https://remotive.com/api/remote-jobs';
const USER_AGENT = 'ClickClickJob Bot 1.0 (Remote Job Aggregator)';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Target categories for admin/support jobs
const TARGET_CATEGORIES = [
  'customer-support',
  'administrative',
  'data',
  'operations'
];

// Target search terms
const SEARCH_TERMS = [
  'administrative',
  'admin assistant',
  'data entry',
  'virtual assistant',
  'customer support',
  'customer service'
];

// Keywords for filtering relevant jobs
const RELEVANT_KEYWORDS = [
  'admin', 'administrative', 'assistant', 'data entry', 'data processing',
  'customer service', 'customer support', 'virtual assistant', 'receptionist',
  'clerk', 'secretary', 'office', 'clerical', 'typing', 'transcription',
  'support specialist', 'help desk', 'back office', 'operations', 'coordinator',
  'executive assistant', 'office manager', 'data analyst', 'content moderator'
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
  const searchText = `${job.title || ''} ${job.description || ''} ${job.category || ''}`.toLowerCase();
  
  // Check for scam keywords
  const hasScamKeywords = SCAM_KEYWORDS.some(keyword => searchText.includes(keyword.toLowerCase()));
  if (hasScamKeywords) {
    logger.debug(`Filtered out scam job: ${job.title}`);
    return false;
  }
  
  // Check for relevant keywords
  const isRelevant = RELEVANT_KEYWORDS.some(keyword => searchText.includes(keyword.toLowerCase()));
  
  return isRelevant;
}

/**
 * Map Remotive job to our schema
 */
function mapJobToSchema(job) {
  // Parse salary if available
  let salaryMin = null;
  let salaryMax = null;
  let salaryCurrency = 'USD';
  
  if (job.salary) {
    // Remotive salary format varies, try to parse
    const salaryText = job.salary.toLowerCase();
    const numbers = salaryText.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      salaryMin = parseInt(numbers[0]) * 1000; // Assume in thousands
      salaryMax = parseInt(numbers[1]) * 1000;
    }
  }
  
  // Parse date
  let datePosted = new Date();
  if (job.publication_date) {
    datePosted = new Date(job.publication_date);
  }
  
  // Determine job type
  let jobType = 'full-time';
  const titleLower = (job.title || '').toLowerCase();
  if (titleLower.includes('part-time') || titleLower.includes('part time')) {
    jobType = 'part-time';
  } else if (titleLower.includes('contract') || titleLower.includes('freelance')) {
    jobType = 'contract';
  } else if (job.job_type) {
    jobType = job.job_type.toLowerCase();
  }
  
  // Build description (Remotive has both description and description_markdown)
  let description = job.description || '';
  if (!description && job.description_markdown) {
    description = job.description_markdown;
  }
  
  return {
    title: job.title || 'Remote Position',
    company: job.company_name || 'Unknown Company',
    location: 'Remote',
    description: description,
    job_url: job.url || job.candidate_required_location || '',
    date_posted: datePosted,
    site: 'remotive',
    job_type: jobType,
    is_remote: true,
    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: salaryCurrency,
    category: job.category || null,
    company_logo: job.company_logo || null,
    tags: job.tags || []
  };
}

/**
 * Fetch jobs from Remotive API
 */
async function fetchRemotiveJobs() {
  const allJobs = [];
  
  try {
    logger.info('Fetching jobs from Remotive API...');
    
    // Fetch all jobs (no category filter to get more results)
    logger.info('Fetching all remote jobs from Remotive...');
    const response = await axios.get(API_BASE_URL, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      }
    });
    
    if (!response.data || !response.data.jobs || !Array.isArray(response.data.jobs)) {
      logger.error('Invalid API response format');
      return [];
    }
    
    const jobs = response.data.jobs;
    logger.info(`Received ${jobs.length} jobs from Remotive`);
    allJobs.push(...jobs);
    
    // Try fetching with specific categories
    for (const category of TARGET_CATEGORIES) {
      try {
        logger.info(`Fetching jobs for category: ${category}...`);
        const catResponse = await axios.get(API_BASE_URL, {
          params: { category: category },
          timeout: REQUEST_TIMEOUT,
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'application/json'
          }
        });
        
        if (catResponse.data && catResponse.data.jobs && Array.isArray(catResponse.data.jobs)) {
          logger.info(`Received ${catResponse.data.jobs.length} jobs for category ${category}`);
          allJobs.push(...catResponse.data.jobs);
        }
        
        // Rate limiting - be nice to their API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.warn(`Error fetching category ${category}: ${error.message}`);
      }
    }
    
    logger.info(`Total jobs fetched: ${allJobs.length}`);
    return allJobs;
    
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      logger.error('Request timeout - Remotive API did not respond');
    } else if (error.response) {
      logger.error(`API error: ${error.response.status} - ${error.response.statusText}`);
    } else if (error.request) {
      logger.error('No response from Remotive API');
    } else {
      logger.error(`Error fetching jobs: ${error.message}`);
    }
    return allJobs; // Return what we have so far
  }
}

/**
 * Main scraping function
 */
async function scrapeRemotive() {
  const startTime = Date.now();
  logger.info('Starting Remotive scraper');
  
  try {
    // Fetch all jobs
    const allJobs = await fetchRemotiveJobs();
    
    if (allJobs.length === 0) {
      logger.warn('No jobs fetched from Remotive');
      fs.writeFileSync(RESULTS_FILE, JSON.stringify([], null, 2));
      return { success: false, jobsFound: 0, errors: ['No jobs fetched'] };
    }
    
    // Remove duplicates by URL first
    const uniqueJobsByUrl = [];
    const seenUrls = new Set();
    
    for (const job of allJobs) {
      const url = job.url || job.id;
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        uniqueJobsByUrl.push(job);
      }
    }
    
    logger.info(`${uniqueJobsByUrl.length} unique jobs after initial deduplication`);
    
    // Filter for relevant jobs
    logger.info('Filtering for relevant admin/support/data entry jobs...');
    const relevantJobs = uniqueJobsByUrl.filter(isRelevantJob);
    
    logger.info(`Found ${relevantJobs.length} relevant jobs out of ${uniqueJobsByUrl.length} unique`);
    
    // Map to our schema
    const mappedJobs = relevantJobs.map(mapJobToSchema);
    
    // Final deduplication by URL (in case mapping changed URLs)
    const finalJobs = [];
    const finalSeenUrls = new Set();
    
    for (const job of mappedJobs) {
      if (!finalSeenUrls.has(job.job_url)) {
        finalSeenUrls.add(job.job_url);
        finalJobs.push(job);
      }
    }
    
    logger.info(`${finalJobs.length} jobs after final deduplication`);
    
    // Save results
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(finalJobs, null, 2));
    logger.info(`Saved ${finalJobs.length} jobs to ${RESULTS_FILE}`);
    
    // Summary stats
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const stats = {
      success: true,
      jobsFound: finalJobs.length,
      totalScraped: allJobs.length,
      uniqueScraped: uniqueJobsByUrl.length,
      filtered: uniqueJobsByUrl.length - relevantJobs.length,
      duplicates: allJobs.length - uniqueJobsByUrl.length,
      duration: `${duration}s`,
      timestamp: new Date().toISOString()
    };
    
    logger.info('=== Remotive Scraper Summary ===');
    logger.info(`Total jobs received: ${stats.totalScraped}`);
    logger.info(`After deduplication: ${stats.uniqueScraped}`);
    logger.info(`Relevant jobs: ${relevantJobs.length}`);
    logger.info(`Filtered out: ${stats.filtered}`);
    logger.info(`Final unique jobs: ${stats.jobsFound}`);
    logger.info(`Duration: ${stats.duration}`);
    logger.info('================================');
    
    return stats;
    
  } catch (error) {
    logger.error(`Scraper failed: ${error.message}`);
    
    // Create empty results file with error info
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
  scrapeRemotive()
    .then(stats => {
      if (stats.success) {
        logger.info('✅ Remotive scraper completed successfully');
        process.exit(0);
      } else {
        logger.error('❌ Remotive scraper failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { scrapeRemotive };

