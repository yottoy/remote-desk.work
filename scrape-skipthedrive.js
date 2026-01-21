#!/usr/bin/env node
/**
 * SkipTheDrive Job Scraper
 * 
 * Scrapes remote jobs from SkipTheDrive.com
 * Site: https://www.skipthedrive.com/
 * Type: HTML scraping (no public API)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Configuration
const RESULTS_FILE = path.join(__dirname, 'skipthedrive-results.json');
const BASE_URL = 'https://www.skipthedrive.com';
const SEARCH_URL = `${BASE_URL}/jobs/`;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const REQUEST_TIMEOUT = 30000;
const MAX_PAGES = 3; // Limit pages to scrape

// Search terms for admin/data entry jobs
const SEARCH_TERMS = [
  'administrative',
  'admin assistant',
  'data entry',
  'virtual assistant',
  'customer service'
];

// Keywords for filtering relevant jobs
const RELEVANT_KEYWORDS = [
  'admin', 'administrative', 'assistant', 'data entry', 'data processing',
  'customer service', 'customer support', 'virtual assistant', 'receptionist',
  'clerk', 'secretary', 'office', 'clerical', 'typing', 'transcription',
  'support specialist', 'help desk', 'coordinator', 'operations'
];

// Scam/spam detection keywords
const SCAM_KEYWORDS = [
  'mlm', 'multi level marketing', 'pyramid', 'investment required',
  'pay to work', 'upfront fee', '$1000/day', '$5000/week', 'get rich quick'
];

// Logger
const logger = {
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`),
  debug: (...args) => console.debug(`DEBUG: ${args.join(' ')}`)
};

/**
 * Delay helper
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if job is relevant
 */
function isRelevantJob(job) {
  const searchText = `${job.title || ''} ${job.description || ''}`.toLowerCase();
  
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
 * Parse job listing from HTML
 */
function parseJobListing($, jobElement) {
  try {
    const $job = $(jobElement);
    
    // Extract title
    const title = $job.find('.job-title, h2, h3, .title').first().text().trim();
    if (!title) return null;
    
    // Extract company
    const company = $job.find('.company-name, .company, .employer').first().text().trim() || 'Company Not Listed';
    
    // Extract URL
    let jobUrl = $job.find('a').first().attr('href');
    if (jobUrl && !jobUrl.startsWith('http')) {
      jobUrl = BASE_URL + (jobUrl.startsWith('/') ? jobUrl : '/' + jobUrl);
    }
    if (!jobUrl) return null;
    
    // Extract description/summary
    const description = $job.find('.description, .summary, .excerpt, p').first().text().trim() || '';
    
    // Extract date posted
    const dateText = $job.find('.date, .posted, time').first().text().trim();
    let datePosted = new Date();
    if (dateText) {
      // Try to parse relative dates like "2 days ago"
      if (dateText.includes('today') || dateText.includes('just now')) {
        datePosted = new Date();
      } else if (dateText.includes('yesterday')) {
        datePosted = new Date(Date.now() - 86400000);
      } else if (dateText.match(/(\d+)\s*(day|days)\s*ago/i)) {
        const daysAgo = parseInt(dateText.match(/(\d+)/)[1]);
        datePosted = new Date(Date.now() - daysAgo * 86400000);
      }
    }
    
    // Determine job type
    let jobType = 'full-time';
    const titleLower = title.toLowerCase();
    if (titleLower.includes('part-time') || titleLower.includes('part time')) {
      jobType = 'part-time';
    } else if (titleLower.includes('contract') || titleLower.includes('freelance')) {
      jobType = 'contract';
    }
    
    return {
      title,
      company,
      location: 'Remote',
      description,
      job_url: jobUrl,
      date_posted: datePosted,
      site: 'skipthedrive',
      job_type: jobType,
      is_remote: true,
      salary_min: null,
      salary_max: null,
      salary_currency: 'USD'
    };
  } catch (error) {
    logger.debug(`Error parsing job: ${error.message}`);
    return null;
  }
}

/**
 * Scrape jobs from a search results page
 */
async function scrapePage(searchTerm, page = 1) {
  try {
    const url = page === 1 
      ? `${SEARCH_URL}?search=${encodeURIComponent(searchTerm)}`
      : `${SEARCH_URL}page/${page}/?search=${encodeURIComponent(searchTerm)}`;
    
    logger.info(`Scraping page ${page} for "${searchTerm}"...`);
    
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': BASE_URL
      }
    });
    
    const $ = cheerio.load(response.data);
    const jobs = [];
    
    // Try multiple selectors for job listings
    const jobSelectors = [
      '.job-listing',
      '.job-item',
      '.job',
      'article.job',
      '.listing',
      'li.job',
      '.job-post'
    ];
    
    let $jobElements = $();
    for (const selector of jobSelectors) {
      $jobElements = $(selector);
      if ($jobElements.length > 0) {
        logger.debug(`Found ${$jobElements.length} jobs using selector: ${selector}`);
        break;
      }
    }
    
    if ($jobElements.length === 0) {
      logger.warn(`No job listings found on page ${page} for "${searchTerm}"`);
      return jobs;
    }
    
    $jobElements.each((i, element) => {
      const job = parseJobListing($, element);
      if (job) {
        jobs.push(job);
      }
    });
    
    logger.info(`Found ${jobs.length} jobs on page ${page}`);
    return jobs;
    
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      logger.error(`Timeout scraping page ${page}: ${error.message}`);
    } else if (error.response) {
      logger.error(`HTTP ${error.response.status} on page ${page}`);
    } else {
      logger.error(`Error scraping page ${page}: ${error.message}`);
    }
    return [];
  }
}

/**
 * Main scraping function
 */
async function scrapeSkipTheDrive() {
  const startTime = Date.now();
  logger.info('Starting SkipTheDrive scraper');
  
  try {
    const allJobs = [];
    
    // Scrape for each search term
    for (const searchTerm of SEARCH_TERMS) {
      logger.info(`\nSearching for: "${searchTerm}"`);
      
      // Scrape multiple pages for each term
      for (let page = 1; page <= MAX_PAGES; page++) {
        const jobs = await scrapePage(searchTerm, page);
        allJobs.push(...jobs);
        
        // If we got no jobs, don't try more pages
        if (jobs.length === 0) {
          logger.info(`No jobs found on page ${page}, stopping pagination for "${searchTerm}"`);
          break;
        }
        
        // Be nice to the server - delay between pages
        if (page < MAX_PAGES) {
          await delay(2000);
        }
      }
      
      // Delay between search terms
      if (searchTerm !== SEARCH_TERMS[SEARCH_TERMS.length - 1]) {
        await delay(3000);
      }
    }
    
    logger.info(`\nTotal jobs scraped: ${allJobs.length}`);
    
    if (allJobs.length === 0) {
      logger.warn('No jobs scraped from SkipTheDrive');
      fs.writeFileSync(RESULTS_FILE, JSON.stringify([], null, 2));
      return { success: false, jobsFound: 0, errors: ['No jobs scraped'] };
    }
    
    // Remove duplicates by URL
    const uniqueJobs = [];
    const seenUrls = new Set();
    
    for (const job of allJobs) {
      if (!seenUrls.has(job.job_url)) {
        seenUrls.add(job.job_url);
        uniqueJobs.push(job);
      }
    }
    
    logger.info(`${uniqueJobs.length} unique jobs after deduplication`);
    
    // Filter for relevant jobs
    const relevantJobs = uniqueJobs.filter(isRelevantJob);
    logger.info(`${relevantJobs.length} relevant jobs after filtering`);
    
    // Save results
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(relevantJobs, null, 2));
    logger.info(`Saved ${relevantJobs.length} jobs to ${RESULTS_FILE}`);
    
    // Summary stats
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const stats = {
      success: true,
      jobsFound: relevantJobs.length,
      totalScraped: allJobs.length,
      duplicates: allJobs.length - uniqueJobs.length,
      filtered: uniqueJobs.length - relevantJobs.length,
      duration: `${duration}s`,
      timestamp: new Date().toISOString()
    };
    
    logger.info('\n=== SkipTheDrive Scraper Summary ===');
    logger.info(`Total jobs scraped: ${stats.totalScraped}`);
    logger.info(`After deduplication: ${uniqueJobs.length}`);
    logger.info(`After filtering: ${stats.jobsFound}`);
    logger.info(`Duration: ${stats.duration}`);
    logger.info('====================================');
    
    return stats;
    
  } catch (error) {
    logger.error(`Scraper failed: ${error.message}`);
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
  scrapeSkipTheDrive()
    .then(stats => {
      if (stats.success) {
        logger.info('✅ SkipTheDrive scraper completed successfully');
        process.exit(0);
      } else {
        logger.error('❌ SkipTheDrive scraper failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { scrapeSkipTheDrive };



