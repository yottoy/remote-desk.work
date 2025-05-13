const axios = require('axios');
const xml2js = require('xml2js');
const logger = require('../utils/logger');
const config = require('../../config/config');
const BaseScraper = require('./BaseScraper');

/**
 * Scraper for We Work Remotely RSS Feed
 * Uses the RSS feed instead of web scraping to avoid Cloudflare protection
 */
class WeWorkRemotelyRssScraper extends BaseScraper {
  constructor() {
    super('WeWorkRemotelyRss');
    this.feedUrl = 'https://weworkremotely.com/remote-jobs.rss'; // Alternative RSS URL
    this.categoryFeedUrls = {
      'customer-service': 'https://weworkremotely.com/categories/customer-service/jobs.rss',
      'administrative': 'https://weworkremotely.com/categories/administrative/jobs.rss',
      'virtual-admin': 'https://weworkremotely.com/remote-jobs.rss'
    };
    this.baseUrl = config.sources.weworkremotely?.baseUrl || 'https://weworkremotely.com';
    this.credibilityScore = config.sources.weworkremotely?.credibilityScore || 9;
    this.categories = config.sources.weworkremotely?.categories || 
                    ['customer-service', 'administrative', 'virtual-admin'];
    this.maxRetries = 3;
  }
  
  /**
   * Scrape jobs from the RSS feed
   */
  async scrape() {
    try {
      logger.info(`Starting to scrape ${this.name} RSS feed`);
      
      const allJobs = [];
      
      // Try to scrape each category's RSS feed
      for (const category of this.categories) {
        try {
          const feedUrl = this.categoryFeedUrls[category] || this.feedUrl;
          logger.info(`Scraping RSS feed for category: ${category} at ${feedUrl}`);
          
          const jobs = await this.scrapeRssFeed(feedUrl, category);
          if (jobs && jobs.length > 0) {
            logger.info(`Found ${jobs.length} jobs for category ${category}`);
            allJobs.push(...jobs);
          }
        } catch (categoryError) {
          logger.error(`Error scraping category ${category}: ${categoryError.message}`);
        }
      }
      
      // If category-specific feeds fail, try the main feed
      if (allJobs.length === 0) {
        logger.info(`No jobs found from category feeds, trying main RSS feed`);
        try {
          const mainFeedJobs = await this.scrapeRssFeed(this.feedUrl);
          if (mainFeedJobs && mainFeedJobs.length > 0) {
            logger.info(`Found ${mainFeedJobs.length} jobs from main feed`);
            allJobs.push(...mainFeedJobs);
          }
        } catch (mainFeedError) {
          logger.error(`Error scraping main feed: ${mainFeedError.message}`);
        }
      }
      
      logger.info(`Successfully processed ${allJobs.length} jobs from RSS feeds`);
      return allJobs;
    } catch (error) {
      logger.error(`Error scraping ${this.name}: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Scrape a specific RSS feed with retry logic
   */
  async scrapeRssFeed(feedUrl, category = null) {
    let retries = 0;
    let lastError = null;
    
    while (retries < this.maxRetries) {
      try {
        // Fetch the RSS feed with a more browser-like approach
        logger.debug(`Attempting to fetch ${feedUrl} (attempt ${retries + 1}/${this.maxRetries})`);
        
        const userAgent = this.getRandomUserAgent();
        logger.debug(`Using user agent: ${userAgent.substring(0, 20)}...`);
        
        const response = await axios.get(feedUrl, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://weworkremotely.com/',
            'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"'
          },
          timeout: 30000
        });
        
        if (response.status !== 200) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        }
        
        // Check if response is actually XML/RSS
        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('xml') && !contentType.includes('rss') && 
            !response.data.includes('<rss') && !response.data.includes('<feed')) {
          logger.warn(`Response doesn't appear to be RSS/XML: ${contentType}`);
          logger.debug(`Response preview: ${response.data.substring(0, 100)}...`);
          
          // If it's HTML with Cloudflare challenge, throw specific error
          if (response.data.includes('Cloudflare') || response.data.includes('challenge') ||
              response.data.includes('Just a moment') || response.data.includes('DDoS protection')) {
            throw new Error('Cloudflare protection detected');
          }
          
          throw new Error('Response is not valid RSS/XML');
        }
        
        // Parse the XML
        const parser = new xml2js.Parser({
          explicitArray: false,
          normalize: true,
          normalizeTags: true
        });
        
        const result = await parser.parseStringPromise(response.data);
        
        if (!result || !result.rss || !result.rss.channel || !result.rss.channel.item) {
          throw new Error('RSS feed has unexpected format');
        }
        
        // Convert to array if only one item
        const items = Array.isArray(result.rss.channel.item) 
          ? result.rss.channel.item 
          : [result.rss.channel.item];
        
        logger.info(`Found ${items.length} items in RSS feed at ${feedUrl}`);
        
        // Filter items by category if specified
        let filteredItems = items;
        if (category) {
          filteredItems = items.filter(item => {
            if (!item.category) return true; // Include if no category specified
            
            // Handle both string and array category
            const categories = Array.isArray(item.category) 
              ? item.category 
              : [item.category];
            
            // Any category contains our target category
            return categories.some(cat => 
              cat.toLowerCase().includes(category.toLowerCase())
            );
          });
          
          logger.info(`Filtered to ${filteredItems.length} relevant jobs for category ${category}`);
        }
        
        // Map RSS items to job objects
        const jobs = filteredItems.map(item => {
          try {
            // Format dates consistently
            const postedDate = item.pubdate ? new Date(item.pubdate) : new Date();
            
            // Clean description
            const description = item.description || '';
            const descriptionText = this.stripHtml(description);
            
            // Create job object
            return {
              title: this.cleanText(item.title),
              company: this.extractCompany(item.title || ''),
              url: item.link || '',
              description: description,
              descriptionText: descriptionText,
              postedDate: postedDate,
              source: this.name,
              credibilityScore: this.credibilityScore,
              category: category || 'general',
              // Required fields for database compatibility
              location: 'Remote',
              // Add these fields to pass quality filter
              qualityScore: 8, // Default quality score, will be recalculated by filter
              primaryKeywords: this.extractPrimaryKeywords(item.title, description)
            };
          } catch (error) {
            logger.error(`Error processing RSS item: ${error.message}`);
            return null;
          }
        }).filter(Boolean); // Filter out null values
        
        return jobs;
      } catch (error) {
        lastError = error;
        logger.warn(`Attempt ${retries + 1}/${this.maxRetries} failed: ${error.message}`);
        retries++;
        
        if (retries < this.maxRetries) {
          // Add exponential backoff
          const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
          logger.debug(`Retrying in ${Math.round(delay / 1000)} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we've exhausted all retries
    throw lastError || new Error(`Failed to fetch RSS feed after ${this.maxRetries} attempts`);
  }
  
  /**
   * Fetch detailed job information if needed
   * This makes a lightweight request and only parses what we need
   */
  async fetchJobDetails(url) {
    logger.debug(`Fetching additional details for ${url}`);
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html',
          'Cache-Control': 'no-cache'
        },
        timeout: 20000
      });
      
      if (response.status !== 200) {
        return null;
      }
      
      const html = response.data;
      
      // Extract company with a simple regex approach to avoid full DOM parsing
      const companyMatch = html.match(/<h2[^>]*>([^<]+)<\/h2>/i) || 
                          html.match(/<span[^>]*class="company"[^>]*>([^<]+)<\/span>/i);
      
      // Extract description with a simple regex approach
      const descMatch = html.match(/<div[^>]*class="listing-container"[^>]*>([\s\S]*?)<\/div>/) ||
                       html.match(/<section[^>]*class="job"[^>]*>([\s\S]*?)<\/section>/);
      
      return {
        company: companyMatch ? this.cleanText(companyMatch[1]) : '',
        description: descMatch ? descMatch[1] : '',
        descriptionText: descMatch ? this.stripHtml(descMatch[1]) : ''
      };
    } catch (error) {
      logger.error(`Error fetching job details: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Extract company name from title
   * Titles are often formatted as "Job Title at Company Name"
   */
  extractCompany(title) {
    // Try to extract company name from format "Title at Company"
    const atMatch = title.match(/\sat\s([^|]+)($|\|)/i);
    if (atMatch && atMatch[1]) {
      return this.cleanText(atMatch[1]);
    }
    
    // Try other common patterns
    const pipeMatch = title.match(/\|([^|]+)$/);
    if (pipeMatch && pipeMatch[1]) {
      return this.cleanText(pipeMatch[1]);
    }
    
    // Fallback
    return 'Unknown Company';
  }
  
  /**
   * Clean text by removing extra whitespace and HTML entities
   */
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Strip HTML tags from text
   */
  stripHtml(html) {
    if (!html) return '';
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Get a random realistic user agent
   */
  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36 Edg/108.0.1462.54',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:108.0) Gecko/20100101 Firefox/108.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:108.0) Gecko/20100101 Firefox/108.0',
      'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:108.0) Gecko/20100101 Firefox/108.0'
    ];
    
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }
  
  /**
   * Extract primary keywords from job title and description
   * @param {string} title - Job title
   * @param {string} description - Job description
   * @returns {Array} - Array of primary keywords found in the job
   */
  extractPrimaryKeywords(title, description) {
    const combinedText = `${title} ${description}`.toLowerCase();
    const primaryKeywords = [
      'data entry', 'data input', 'administrative assistant', 'admin assistant',
      'virtual assistant', 'customer service representative', 'customer service rep',
      'data processing', 'data analyst', 'data specialist', 'admin support',
      'executive assistant', 'office assistant', 'remote assistant'
    ];
    
    return primaryKeywords.filter(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      return regex.test(combinedText);
    });
  }
}

module.exports = WeWorkRemotelyRssScraper; 