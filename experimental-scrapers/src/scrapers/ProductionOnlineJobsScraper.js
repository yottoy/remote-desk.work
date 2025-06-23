const OnlineJobsPhScraper = require('./OnlineJobsPhScraper');
const logger = require('../utils/logger');
const { randomDelay } = require('../utils/helpers');

/**
 * Production-ready OnlineJobs.ph scraper with enhanced capabilities
 */
class ProductionOnlineJobsScraper extends OnlineJobsPhScraper {
  constructor(config = {}) {
    super({
      headless: true,
      timeout: 60000,
      maxRetries: 3,
      maxPages: config.maxPages || 20, // Default to 20 pages for production
      ...config
    });
    
    this.name = 'ProductionOnlineJobsPh';
    this.batchSize = config.batchSize || 5; // Process pages in batches
    this.delayBetweenBatches = config.delayBetweenBatches || 30000; // 30 seconds between batches
  }

  /**
   * Random delay helper method
   */
  async randomDelay(min = 1000, max = 3000) {
    return randomDelay(min, max);
  }

  /**
   * Production scraping with batch processing and enhanced error handling
   */
  async scrape() {
    try {
      const initialized = await this.init();
      if (!initialized) {
        throw new Error('Failed to initialize scraper');
      }

      logger.info(`Starting Production OnlineJobs.ph scraping (up to ${this.maxPages} pages in batches of ${this.batchSize})`);
      
      const allJobs = [];
      let currentPage = 1;
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 3;
      
      // Process pages in batches to be more respectful to the server
      while (currentPage <= this.maxPages && consecutiveFailures < maxConsecutiveFailures) {
        const batchStart = currentPage;
        const batchEnd = Math.min(currentPage + this.batchSize - 1, this.maxPages);
        
        logger.info(`Processing batch: pages ${batchStart}-${batchEnd}`);
        
        const batchJobs = [];
        let batchFailures = 0;
        
        // Process batch
        for (let page = batchStart; page <= batchEnd; page++) {
          try {
            logger.info(`Scraping page ${page}/${this.maxPages}`);
            
            const pageJobs = await this.scrapePage(page);
            
            if (pageJobs.length === 0) {
              logger.warn(`No jobs found on page ${page}`);
              batchFailures++;
              
              // If we get multiple empty pages in a row, we might have reached the end
              if (batchFailures >= 2) {
                logger.info(`Multiple empty pages detected, stopping at page ${page}`);
                break;
              }
            } else {
              batchJobs.push(...pageJobs);
              logger.info(`Page ${page}: Found ${pageJobs.length} jobs (Batch total: ${batchJobs.length})`);
              consecutiveFailures = 0; // Reset failure counter on success
            }
            
            // Respectful delay between pages within a batch
            if (page < batchEnd) {
              await this.randomDelay(2000, 4000);
            }
            
          } catch (error) {
            logger.error(`Error scraping page ${page}: ${error.message}`);
            batchFailures++;
            consecutiveFailures++;
            
            // Longer delay after error
            await this.randomDelay(5000, 8000);
          }
        }
        
        allJobs.push(...batchJobs);
        currentPage = batchEnd + 1;
        
        logger.info(`Batch completed: ${batchJobs.length} jobs found (Total: ${allJobs.length})`);
        
        // Longer delay between batches to be respectful
        if (currentPage <= this.maxPages && consecutiveFailures < maxConsecutiveFailures) {
          logger.info(`Waiting ${this.delayBetweenBatches / 1000} seconds before next batch...`);
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
        }
      }
      
      // Remove duplicates and filter for quality
      const uniqueJobs = this.removeDuplicates(allJobs);
      const qualityJobs = this.filterForQuality(uniqueJobs);
      
      logger.info(`Production OnlineJobs.ph scraping completed. Found ${qualityJobs.length} quality jobs from ${allJobs.length} total across ${currentPage - 1} pages`);
      return qualityJobs;
      
    } catch (error) {
      logger.error(`Production OnlineJobs.ph scraping failed: ${error.message}`);
      return [];
    } finally {
      await this.close();
    }
  }

  /**
   * Enhanced quality filtering for production use
   */
  filterForQuality(jobs) {
    return jobs.filter(job => {
      // Must have essential fields
      if (!job.title || !job.company || job.title.length < 3 || job.company.length < 2) {
        return false;
      }
      
      // Filter out obvious spam or low-quality posts
      const spamIndicators = [
        'test job', 'sample job', 'fake job', 'demo job',
        'xxx', 'aaa', 'bbb', 'ccc', 'ddd',
        'urgent urgent', 'asap asap'
      ];
      
      const titleLower = job.title.toLowerCase();
      const companyLower = job.company.toLowerCase();
      
      for (const indicator of spamIndicators) {
        if (titleLower.includes(indicator) || companyLower.includes(indicator)) {
          return false;
        }
      }
      
      // Filter out jobs with suspicious patterns
      if (job.title.length > 200 || job.company.length > 100) {
        return false;
      }
      
      // Must have a reasonable posted date (not too far in the future)
      if (job.postedDate) {
        const now = new Date();
        const futureLimit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in future
        if (job.postedDate > futureLimit) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Enhanced duplicate removal with fuzzy matching
   */
  removeDuplicates(jobs) {
    const seen = new Set();
    const unique = [];
    
    for (const job of jobs) {
      // Create multiple keys for better duplicate detection
      const urlKey = job.url || '';
      const titleCompanyKey = `${job.title.toLowerCase().trim()}-${job.company.toLowerCase().trim()}`;
      const fuzzyTitleKey = this.createFuzzyKey(job.title, job.company);
      
      const keys = [urlKey, titleCompanyKey, fuzzyTitleKey].filter(key => key.length > 0);
      
      let isDuplicate = false;
      for (const key of keys) {
        if (seen.has(key)) {
          isDuplicate = true;
          break;
        }
      }
      
      if (!isDuplicate) {
        keys.forEach(key => seen.add(key));
        unique.push(job);
      }
    }
    
    return unique;
  }

  /**
   * Create a fuzzy key for duplicate detection
   */
  createFuzzyKey(title, company) {
    // Remove common words and normalize
    const commonWords = ['the', 'and', 'or', 'for', 'in', 'on', 'at', 'to', 'a', 'an'];
    
    const normalizeText = (text) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 2 && !commonWords.includes(word))
        .sort()
        .join('');
    };
    
    return `${normalizeText(title)}-${normalizeText(company)}`;
  }

  /**
   * Get production statistics
   */
  getStats(jobs) {
    const stats = {
      total: jobs.length,
      remote: jobs.filter(job => job.isRemote).length,
      withSalary: jobs.filter(job => job.salary && job.salary.length > 0).length,
      withUrl: jobs.filter(job => job.url && job.url.length > 0).length,
      recentJobs: jobs.filter(job => {
        if (!job.postedDate) return false;
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return job.postedDate >= dayAgo;
      }).length,
      categories: {}
    };
    
    // Count by job categories
    jobs.forEach(job => {
      const category = this.categorizeJob(job);
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Categorize jobs for better organization
   */
  categorizeJob(job) {
    const title = job.title.toLowerCase();
    
    if (title.includes('virtual assistant') || title.includes('va ')) {
      return 'Virtual Assistant';
    } else if (title.includes('data entry')) {
      return 'Data Entry';
    } else if (title.includes('customer service') || title.includes('support')) {
      return 'Customer Service';
    } else if (title.includes('marketing') || title.includes('social media')) {
      return 'Marketing';
    } else if (title.includes('writer') || title.includes('content')) {
      return 'Content Writing';
    } else if (title.includes('design') || title.includes('graphic')) {
      return 'Design';
    } else if (title.includes('admin') || title.includes('assistant')) {
      return 'Administrative';
    } else {
      return 'Other';
    }
  }
}

module.exports = ProductionOnlineJobsScraper; 