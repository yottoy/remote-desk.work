/**
 * AdminDataEntryScraper.js
 * 
 * Specialized scraper for remote administrative and data entry jobs
 * Uses JobSpy to target specific job categories and properly filter results
 */

const axios = require('axios');
const logger = require('../utils/logger');
const BaseScraper = require('./BaseScraper');
const adminEntryConfig = require('../../config/admin-entry-config');
const database = require('../utils/database');
const bridgeManager = require('../utils/bridgeManager');

/**
 * Admin and Data Entry specialized scraper using JobSpy
 */
class AdminDataEntryScraper extends BaseScraper {
  constructor() {
    super('AdminDataEntry');
    
    // Load configuration
    this.config = adminEntryConfig;
    
    // Set scraper version for tracking
    this.version = '1.0.0';
    
    // Set bridge URL
    this.bridgeUrl = process.env.JOBSPY_BRIDGE_URL || 'http://localhost:8000';
    
    // Initialize result tracking
    this.results = {
      totalJobs: 0,
      sourceStats: {},
      errors: [],
      adminJobsFound: 0,
      dataEntryJobsFound: 0,
      customerServiceJobsFound: 0,
      otherJobsFound: 0,
      filteredOut: 0,
      startTime: null,
      endTime: null
    };
  }
  
  /**
   * Main scraping method
   */
  async scrape() {
    try {
      logger.info('Starting AdminDataEntryScraper with JobSpy integration');
      this.results.startTime = new Date();
      
      // Check if bridge is running
      await this._checkBridgeStatus();
      
      // Create combined search terms array
      const allSearchTerms = [
        ...this.config.adminSearchTerms,
        ...this.config.dataEntrySearchTerms,
        ...this.config.customerServiceSearchTerms
      ];
      
      // Get enabled sources
      const enabledSources = Object.entries(this.config.sources)
        .filter(([, config]) => config.enabled)
        .map(([source]) => source);
      
      logger.info(`Using JobSpy to scrape ${enabledSources.length} sources with ${allSearchTerms.length} search terms`);
      
      // Scrape each source
      const jobs = [];
      for (const source of enabledSources) {
        logger.info(`Scraping ${source} for remote admin and data entry positions`);
        
        // Get source config
        const sourceConfig = this.config.sources[source];
        
        // Scrape each search term for this source
        for (const searchTerm of allSearchTerms) {
          for (const location of this.config.locations) {
            try {
              const sourceJobs = await this._scrapeSource(source, searchTerm, location, sourceConfig);
              jobs.push(...sourceJobs);
              
              // Be nice to the API and wait a bit between requests
              await this._delay(3000);
            } catch (error) {
              logger.error(`Error scraping ${source} with term "${searchTerm}": ${error.message}`);
              this.results.errors.push({
                source,
                searchTerm,
                error: error.message,
                time: new Date().toISOString()
              });
            }
          }
        }
      }
      
      // Store raw jobs for debugging
      const rawJobs = [...jobs];
      
      // Process and filter the scraped jobs
      const filteredJobs = await this._processJobs(jobs);
      
      // Save jobs to database
      const savedStats = await this._saveJobsToDatabase(filteredJobs);
      
      // Update final results
      this.results.endTime = new Date();
      this.results.duration = (this.results.endTime - this.results.startTime) / 1000; // in seconds
      
      logger.info(`AdminDataEntryScraper completed in ${this.results.duration}s`);
      logger.info(`Found: ${this.results.totalJobs} jobs (${this.results.adminJobsFound} admin, ${this.results.dataEntryJobsFound} data entry, ${this.results.customerServiceJobsFound} customer service)`);
      logger.info(`Filtered out: ${this.results.filteredOut} irrelevant jobs`);
      logger.info(`Saved to database: ${savedStats.saved} (${savedStats.duplicates} duplicates)`);
      
      return {
        stats: this.results,
        jobs: filteredJobs,
        rawJobs // Add raw jobs for debugging
      };
    } catch (error) {
      logger.error(`AdminDataEntryScraper failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Check if the JobSpy bridge is running
   * @private
   */
  async _checkBridgeStatus() {
    try {
      // Use bridgeManager's checkStatus method instead of direct API call
      const isRunning = await bridgeManager.checkStatus();
      
      if (!isRunning) {
        throw new Error("Bridge is not running");
      }
      
      logger.info('JobSpy bridge is running');
      return true;
    } catch (error) {
      logger.error(`JobSpy bridge is not running: ${error.message}`);
      
      // Try to start the bridge
      logger.info('Attempting to start JobSpy bridge...');
      const started = await bridgeManager.start();
      
      if (!started) {
        throw new Error('Failed to start JobSpy bridge');
      }
      
      // Wait for the bridge to be ready
      await this._delay(5000);
      return true;
    }
  }
  
  /**
   * Scrape a specific source with JobSpy
   * @param {string} source - Source name
   * @param {string} searchTerm - Search term
   * @param {string} location - Location string
   * @param {object} sourceConfig - Source configuration
   * @returns {Promise<Array>} - Array of job objects
   * @private
   */
  async _scrapeSource(source, searchTerm, location, sourceConfig) {
    try {
      // Initialize source stats if not exists
      if (!this.results.sourceStats[source]) {
        this.results.sourceStats[source] = { 
          jobsFound: 0, 
          searchTermStats: {},
          errors: 0 
        };
      }
      
      // Create request payload for JobSpy
      const payload = {
        site_names: [source],
        search_terms: [searchTerm],
        location: location,
        results_wanted: this.config.general.resultsWanted,
        hours_old: this.config.general.hoursOld,
        is_remote: this.config.general.isRemote,
        country_indeed: sourceConfig.countryCode || "USA",
        distance: sourceConfig.distance || 50,
        linkedin_fetch_description: source === 'linkedin' ? sourceConfig.fetchDescription : false,
        description_format: this.config.general.descriptionFormat,
      };
      
      logger.info(`Scraping ${source} for "${searchTerm}" in location "${location || 'any'}"...`);
      
      // Make request to JobSpy bridge
      const response = await axios.post(`${this.bridgeUrl}/scrape-jobs`, payload, {
        timeout: 60000 // 60 second timeout
      });
      
      // Validate response
      if (!response.data || !response.data.jobs || !Array.isArray(response.data.jobs)) {
        throw new Error('Invalid response structure from bridge');
      }
      
      const jobs = response.data.jobs;
      
      // Add source and search metadata to each job
      const jobsWithMeta = jobs.map(job => ({
        ...job,
        source,
        search_term: searchTerm,
        search_location: location,
        scraped_date: new Date(),
        credibilityScore: sourceConfig.credibilityScore || 5
      }));
      
      // Update stats
      const jobCount = jobsWithMeta.length;
      this.results.totalJobs += jobCount;
      this.results.sourceStats[source].jobsFound += jobCount;
      
      // Track search term stats
      if (!this.results.sourceStats[source].searchTermStats[searchTerm]) {
        this.results.sourceStats[source].searchTermStats[searchTerm] = 0;
      }
      this.results.sourceStats[source].searchTermStats[searchTerm] += jobCount;
      
      logger.info(`Found ${jobCount} jobs from ${source} for "${searchTerm}" in location "${location || 'any'}"`);
      
      return jobsWithMeta;
    } catch (error) {
      // Track error
      this.results.sourceStats[source].errors++;
      throw error;
    }
  }
  
  /**
   * Process and filter job listings
   * @param {Array} jobs - Job listings to process
   * @returns {Promise<Array>} - Filtered job listings
   * @private
   */
  async _processJobs(jobs) {
    logger.info(`Processing ${jobs.length} scraped jobs`);
    
    // Filter out duplicate jobs by URL - handle JobSpy's URL field names
    // JobSpy returns URLs in job_url field, not url field
    const uniqueUrls = new Set();
    const urlDeduped = jobs.filter(job => {
      // Get URL from either job.url or job.job_url field
      const jobUrl = job.url || job.job_url || null;
      
      // Skip jobs without valid URLs
      if (!jobUrl) {
        logger.debug(`Skipping job without URL: ${job.title || 'Unknown'} at ${job.company || 'Unknown'}`);
        return false;
      }
      
      // Skip jobs with example.com URLs
      if (jobUrl.includes('example.com')) {
        logger.debug(`Skipping job with example.com URL: ${jobUrl}`);
        return false;
      }
      
      if (uniqueUrls.has(jobUrl)) {
        return false;
      }
      uniqueUrls.add(jobUrl);
      job.url = jobUrl; // Normalize to always use 'url' field
      return true;
    });
    
    logger.info(`Removed ${jobs.length - urlDeduped.length} jobs with duplicate or invalid URLs`);
    
    // Process each job
    const processedJobs = [];
    
    for (const job of urlDeduped) {
      try {
        // Basic data cleanup and field normalization
        const processedJob = this._cleanJobData(job);
        
        // Skip jobs that failed URL validation
        if (processedJob.urlValidationFailed) {
          logger.debug(`Skipping job that failed URL validation: ${processedJob.title}`);
          this.results.filteredOut++;
          continue;
        }
        
        // Check if job is relevant to our categories using enhanced patterns
        const categoryInfo = this._categorizeJob(processedJob);
        
        if (!categoryInfo.isRelevant) {
          this.results.filteredOut++;
          continue;
        }
        
        // Assign job category and update stats
        processedJob.category = categoryInfo.category;
        switch (categoryInfo.category) {
          case 'admin':
            this.results.adminJobsFound++;
            break;
          case 'data_entry':
            this.results.dataEntryJobsFound++;
            break;
          case 'customer_service':
            this.results.customerServiceJobsFound++;
            break;
          default:
            this.results.otherJobsFound++;
        }
        
        // Calculate quality score
        processedJob.qualityScore = this._calculateQualityScore(processedJob);
        
        // Add to processed jobs if meets minimum quality threshold
        if (processedJob.qualityScore >= this.config.qualityScoring.minQualityScore) {
          // Set featured flag
          processedJob.featured = processedJob.qualityScore >= this.config.qualityScoring.featuredThreshold;
          
          // Add to final set
          processedJobs.push(processedJob);
        } else {
          this.results.filteredOut++;
        }
      } catch (error) {
        logger.error(`Error processing job: ${error.message}`);
        this.results.filteredOut++;
      }
    }
    
    logger.info(`Processed and filtered jobs: ${processedJobs.length} kept, ${this.results.filteredOut} filtered out`);
    return processedJobs;
  }
  
  /**
   * Clean and normalize job data
   * @param {Object} job - Raw job data
   * @returns {Object} - Cleaned job data
   * @private
   */
  _cleanJobData(job) {
    const cleaned = { ...job };
    
    // Ensure title and company are strings
    cleaned.title = String(cleaned.title || '').trim();
    cleaned.company = String(cleaned.company || '').trim();
    
    // Default location to remote if missing
    cleaned.location = String(cleaned.location || 'Remote').trim();
    
    // Normalize URL field - JobSpy returns URLs in job_url and job_url_direct fields
    cleaned.url = cleaned.url || cleaned.job_url || cleaned.job_url_direct || null;
    
    // Validate URL - reject example.com and ensure URL exists and is valid
    if (cleaned.url) {
      try {
        const url = new URL(cleaned.url);
        // Only allow http/https URLs and filter out example.com URLs
        if (!(url.protocol === 'http:' || url.protocol === 'https:') || 
            url.hostname.includes('example.com')) {
          logger.warn(`Invalid URL protocol or example.com domain: ${cleaned.url}`);
          cleaned.url = null;
          cleaned.urlValidationFailed = true;
        }
      } catch (err) {
        logger.warn(`Invalid URL format: ${cleaned.url}`);
        cleaned.url = null;
        cleaned.urlValidationFailed = true;
      }
    } else {
      cleaned.urlValidationFailed = true;
    }
    
    // Construct salary string from JobSpy components if not already present
    if (!cleaned.salary && (cleaned.min_amount || cleaned.max_amount)) {
      const minAmount = cleaned.min_amount || '';
      const maxAmount = cleaned.max_amount || '';
      const interval = cleaned.interval || '';
      
      if (minAmount && maxAmount && minAmount !== maxAmount) {
        cleaned.salary = `${minAmount}-${maxAmount} ${interval}`;
      } else if (minAmount) {
        cleaned.salary = `${minAmount} ${interval}`;
      } else if (maxAmount) {
        cleaned.salary = `${maxAmount} ${interval}`;
      }
    }
    
    // Normalize date fields - JobSpy uses date_posted
    if (cleaned.date_posted && !cleaned.date) {
      cleaned.date = cleaned.date_posted;
    }
    
    // Clean up description - extract plain text for filtering
    if (cleaned.description) {
      // Store both HTML/markdown and plain text versions
      cleaned.descriptionText = this._extractTextFromHtml(cleaned.description);
    } else {
      cleaned.description = '';
      cleaned.descriptionText = '';
    }
    
    // Standardize date format if exists
    if (cleaned.date) {
      try {
        cleaned.postedDate = new Date(cleaned.date);
      } catch (e) {
        cleaned.postedDate = new Date();
      }
    } else {
      cleaned.postedDate = new Date();
    }
    
    // Add scrapedDate if not exists
    cleaned.scrapedDate = cleaned.scraped_date || new Date();
    
    // Generate tags
    cleaned.tags = this._generateTags(cleaned);
    
    return cleaned;
  }
  
  /**
   * Determine if a job is relevant to our categories
   * @param {Object} job - Job data
   * @returns {Object} - Category information
   * @private
   */
  _categorizeJob(job) {
    const title = job.title.toLowerCase();
    const description = job.descriptionText.toLowerCase();
    const combinedText = `${title} ${description}`;
    
    // Check if this is an excluded job title (senior positions, etc.)
    // But make exceptions for relevant roles even if they contain excluded terms
    if (title.includes('senior') || title.includes('sr.') || title.includes('lead')) {
      // Allow if they specifically mention admin or data entry in the title
      if (!title.includes('admin') && 
          !title.includes('assistant') && 
          !title.includes('data entry') && 
          !title.includes('clerk')) {
        return { isRelevant: false };
      }
    } else {
      // Check other exclusion terms without exception
      for (const term of this.config.filters.excludeTitleTerms) {
        if (term !== 'senior' && term !== 'sr.' && term !== 'lead' && 
            title.includes(term.toLowerCase())) {
          return { isRelevant: false };
        }
      }
    }
    
    // Check if description is too short - but be more lenient
    const minWords = Math.min(50, this.config.filters.minDescriptionLength);
    if (job.descriptionText.split(/\s+/).length < minWords) {
      return { isRelevant: false };
    }
    
    // Check if salary (if available) is outside our range - with wider acceptable range
    if (job.salary) {
      const numbers = job.salary.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        const lowestSalary = Math.min(...numbers.map(n => parseInt(n, 10)));
        const highestSalary = Math.max(...numbers.map(n => parseInt(n, 10)));
        
        // More flexible salary interpretation
        let isHourly = false;
        let yearlyEquivalent = 0;
        
        // Check if explicitly marked as hourly
        if (job.interval === 'hourly') {
          isHourly = true;
          yearlyEquivalent = highestSalary * 2000; // Approximate yearly equivalent
        } else if (job.interval === 'yearly') {
          yearlyEquivalent = highestSalary;
        } else {
          // Try to guess from the values
          if (highestSalary < 200) {
            isHourly = true;
            yearlyEquivalent = highestSalary * 2000;
          } else if (highestSalary < 5000) {
            // Likely monthly
            yearlyEquivalent = highestSalary * 12;
          } else {
            // Likely yearly
            yearlyEquivalent = highestSalary;
          }
        }
        
        // Filter extremely high salaries (likely not admin/data entry)
        if (yearlyEquivalent > 120000) {
          return { isRelevant: false };
        }
      }
    }
    
    // Category pattern matching - check against each of our pattern groups
    let isAdmin = false;
    let isDataEntry = false;  
    let isCustomerService = false;
    let isRemote = false;
    
    // Enhanced admin patterns - check both standard and extended matches
    const adminKeywords = [
      'administrative', 'admin', 'assistant', 'virtual assistant', 
      'executive assistant', 'office assistant', 'receptionist', 
      'secretary', 'office coordinator', 'admin support', 
      'office manager', 'calendar management', 'scheduling',
      'appointment', 'inbox management', 'email management',
      'office support', 'clerical', 'administrative support'
    ];
    
    // Check extended admin keywords
    for (const keyword of adminKeywords) {
      if (combinedText.includes(keyword)) {
        isAdmin = true;
        break;
      }
    }
    
    // Check admin patterns from config if not already matched
    if (!isAdmin) {
      for (const pattern of this.config.patterns.adminPatterns) {
        if (pattern.test(combinedText)) {
          isAdmin = true;
          break;
        }
      }
    }
    
    // Enhanced data entry patterns
    const dataEntryKeywords = [
      'data entry', 'data input', 'data processor', 'data clerk',
      'typist', 'transcription', 'transcriptionist', 'data processing',
      'typing', 'data specialist', 'keying', 'data management', 
      'spreadsheet', 'excel', 'database entry', 'information input',
      'word processing', 'form processing', 'document processing',
      'data verification', 'data validation'
    ];
    
    // Check extended data entry keywords
    for (const keyword of dataEntryKeywords) {
      if (combinedText.includes(keyword)) {
        isDataEntry = true;
        break;
      }
    }
    
    // Check data entry patterns from config if not already matched
    if (!isDataEntry) {
      for (const pattern of this.config.patterns.dataEntryPatterns) {
        if (pattern.test(combinedText)) {
          isDataEntry = true;
          break;
        }
      }
    }
    
    // Enhanced customer service patterns
    const customerServiceKeywords = [
      'customer service', 'customer support', 'client service',
      'call center', 'help desk', 'customer care', 'support specialist',
      'client coordinator', 'phone support', 'email support',
      'client communications', 'customer experience', 'customer success'
    ];
    
    // Check extended customer service keywords
    for (const keyword of customerServiceKeywords) {
      if (combinedText.includes(keyword)) {
        isCustomerService = true;
        break;
      }
    }
    
    // Check customer service patterns from config if not already matched
    if (!isCustomerService) {
      for (const pattern of this.config.patterns.customerServicePatterns) {
        if (pattern.test(combinedText)) {
          isCustomerService = true;
          break;
        }
      }
    }
    
    // Enhanced remote patterns
    const remoteKeywords = [
      'remote', 'work from home', 'wfh', 'virtual', 'telecommute',
      'home-based', 'work at home', 'remote position', 'remotely', 
      'distributed team', 'anywhere', 'work location: remote',
      'location: remote', 'remote, us', 'remote work'
    ];
    
    // Check extended remote keywords
    for (const keyword of remoteKeywords) {
      if (combinedText.includes(keyword) || job.is_remote === true) {
        isRemote = true;
        break;
      }
    }
    
    // Check remote patterns from config if not already matched
    if (!isRemote) {
      for (const pattern of this.config.patterns.remotePatterns) {
        if (pattern.test(combinedText)) {
          isRemote = true;
          break;
        }
      }
    }
    
    // Job must be remote to be relevant
    if (!isRemote && !job.is_remote) {
      return { isRelevant: false };
    }
    
    // Determine job category and relevance
    if (isAdmin) {
      return { isRelevant: true, category: 'admin' };
    } else if (isDataEntry) {
      return { isRelevant: true, category: 'data_entry' };
    } else if (isCustomerService) {
      return { isRelevant: true, category: 'customer_service' };
    }
    
    // Last fallback check for common admin/data entry keywords in title
    if (title.includes('assistant') || title.includes('clerk') || 
        title.includes('admin') || title.includes('coordinator') ||
        title.includes('support') || title.includes('data')) {
      
      // Check for common skills in the description
      const adminDataSkills = [
        'typing', 'microsoft office', 'excel', 'organized', 
        'attention to detail', 'scheduling', 'email', 'communication',
        'data', 'administrative', 'microsoft', 'documentation'
      ];
      
      for (const skill of adminDataSkills) {
        if (description.includes(skill)) {
          return { isRelevant: true, category: 'admin' };
        }
      }
    }
    
    // Non-categorized but passed the initial filters
    return { isRelevant: false };
  }
  
  /**
   * Generate tags for job listing
   * @param {Object} job - Job data
   * @returns {Array} - Tags
   * @private
   */
  _generateTags(job) {
    const tags = [];
    const title = job.title.toLowerCase();
    const description = job.descriptionText.toLowerCase();
    
    // Add category based tags
    if (title.includes('data entry') || description.includes('data entry')) {
      tags.push('data entry');
    }
    
    if (title.includes('administrative') || description.includes('administrative')) {
      tags.push('administrative');
    }
    
    if (title.includes('assistant') || description.includes('assistant')) {
      tags.push('assistant');
    }
    
    if (title.includes('customer service') || description.includes('customer service')) {
      tags.push('customer service');
    }
    
    // Add schedule based tags
    if (title.includes('part-time') || description.includes('part-time') || 
        title.includes('part time') || description.includes('part time')) {
      tags.push('part-time');
    }
    
    if (title.includes('full-time') || description.includes('full-time') ||
        title.includes('full time') || description.includes('full time')) {
      tags.push('full-time');
    }
    
    if (title.includes('contract') || description.includes('contract')) {
      tags.push('contract');
    }
    
    // Add experience based tags
    if (title.includes('entry level') || description.includes('entry level') ||
        title.includes('entry-level') || description.includes('entry-level')) {
      tags.push('entry-level');
    }
    
    if (description.includes('no experience') || 
        description.includes('no prior experience') ||
        description.includes('no previous experience')) {
      tags.push('no experience');
    }
    
    // Add location based tags
    if (job.location.toLowerCase().includes('usa') || 
        job.location.toLowerCase().includes('united states') ||
        description.includes('u.s. only') ||
        description.includes('us only')) {
      tags.push('us-only');
    }
    
    if (job.location.toLowerCase().includes('worldwide') ||
        description.includes('worldwide') ||
        description.includes('global')) {
      tags.push('worldwide');
    }
    
    return tags;
  }
  
  /**
   * Calculate the quality score for a job listing
   * @param {Object} job - Job data
   * @returns {number} - Quality score (0-10)
   * @private
   */
  _calculateQualityScore(job) {
    // Calculate component scores
    const relevanceScore = this._calculateRelevanceScore(job);
    const qualityIndicatorScore = this._calculateQualityIndicatorScore(job);
    const credibilityScore = job.credibilityScore || 5;
    const recencyScore = this._calculateRecencyScore(job);
    
    // Store component scores
    job.relevanceScore = relevanceScore;
    job.qualityIndicatorScore = qualityIndicatorScore;
    job.credibilityScore = credibilityScore;
    job.recencyScore = recencyScore;
    
    // Calculate weighted average
    const weights = this.config.qualityScoring.weights;
    const weightedScore = 
      (relevanceScore * weights.relevanceScore) +
      (qualityIndicatorScore * weights.qualityIndicatorScore) +
      (credibilityScore * weights.credibilityScore) +
      (recencyScore * weights.recencyScore);
    
    // Round to 1 decimal place
    return Math.round(weightedScore * 10) / 10;
  }
  
  /**
   * Calculate relevance score - how relevant to admin/data entry
   * @param {Object} job - Job data
   * @returns {number} - Score (0-10)
   * @private
   */
  _calculateRelevanceScore(job) {
    let score = 5; // Start at neutral
    const title = job.title.toLowerCase();
    const description = job.descriptionText.toLowerCase();
    const category = job.category;
    
    // Boost based on category
    if (category === 'admin' || category === 'data_entry') {
      score += 2;
    } else if (category === 'customer_service') {
      score += 1;
    }
    
    // Boost if title explicitly mentions key terms
    if (title.includes('data entry') || 
        title.includes('administrative assistant') || 
        title.includes('virtual assistant')) {
      score += 2;
    }
    
    // Check relevance based on required skills in description
    const relevantSkills = [
      'typing', 'microsoft office', 'excel', 'word', 'data entry',
      'administrative', 'filing', 'organization', 'detail oriented',
      'communication skills', 'customer service', 'email management'
    ];
    
    for (const skill of relevantSkills) {
      if (description.includes(skill)) {
        score += 0.2;
      }
    }
    
    // Cap at 10
    return Math.min(Math.max(score, 0), 10);
  }
  
  /**
   * Calculate quality indicator score - measure of listing quality
   * @param {Object} job - Job data
   * @returns {number} - Score (0-10)
   * @private
   */
  _calculateQualityIndicatorScore(job) {
    let score = 5; // Start neutral
    const description = job.descriptionText.toLowerCase();
    
    // Description length factor (longer is usually better)
    const wordCount = description.split(/\s+/).length;
    if (wordCount > 500) {
      score += 1;
    } else if (wordCount > 300) {
      score += 0.5;
    } else if (wordCount < 100) {
      score -= 2;
    }
    
    // Check positive indicators
    for (const term of this.config.qualityScoring.positiveKeywords) {
      if (description.includes(term)) {
        score += 0.3;
      }
    }
    
    // Check negative indicators
    for (const term of this.config.qualityScoring.negativeKeywords) {
      if (description.includes(term)) {
        score -= 1.5;
      }
    }
    
    // Structure indicators
    if (description.includes('responsibilities:') || description.includes('duties:')) {
      score += 0.5;
    }
    
    if (description.includes('requirements:') || description.includes('qualifications:')) {
      score += 0.5;
    }
    
    if (description.includes('benefits:') || description.includes('we offer:')) {
      score += 0.5;
    }
    
    // Cap at 0-10
    return Math.min(Math.max(score, 0), 10);
  }
  
  /**
   * Calculate recency score based on posting date
   * @param {Object} job - Job data
   * @returns {number} - Score (0-10)
   * @private
   */
  _calculateRecencyScore(job) {
    // Default to max if no date
    if (!job.postedDate) {
      return 10;
    }
    
    const now = new Date();
    const postedDate = new Date(job.postedDate);
    const ageInDays = (now - postedDate) / (1000 * 60 * 60 * 24);
    
    // Newer is better
    if (ageInDays <= 1) {
      return 10; // Posted today
    } else if (ageInDays <= 2) {
      return 9; // Posted yesterday
    } else if (ageInDays <= 3) {
      return 8; // Posted 2-3 days ago
    } else if (ageInDays <= 7) {
      return 7; // Posted this week
    } else if (ageInDays <= 14) {
      return 5; // Posted last week
    } else if (ageInDays <= 30) {
      return 3; // Posted this month
    }
    
    return 1; // Older than a month
  }
  
  /**
   * Save filtered jobs to database
   * @param {Array} jobs - Filtered jobs
   * @returns {Promise<Object>} - Save stats
   * @private
   */
  async _saveJobsToDatabase(jobs) {
    try {
      // Filter out jobs with invalid URLs before saving
      const validJobs = jobs.filter(job => {
        if (!job.url || job.url.includes('example.com') || job.is_mock_data === true) {
          logger.warn(`Skipping job with invalid URL or mock data: ${job.title} at ${job.company}`);
          return false;
        }
        
        try {
          // Perform one final URL validation
          new URL(job.url);
          return true;
        } catch (e) {
          logger.warn(`Skipping job with malformed URL: ${job.url}`);
          return false;
        }
      });
      
      logger.info(`Filtered out ${jobs.length - validJobs.length} jobs with invalid URLs before database insertion`);
      
      if (validJobs.length === 0) {
        logger.warn('No valid jobs to save to database');
        return { saved: 0, duplicates: 0 };
      }
      
      // Get collection reference
      const db = await database.getConnection();
      const collection = db.collection('jobs');
      
      // Check for existing URLs to avoid duplicates
      const existingUrls = new Set();
      const urlCursor = await collection.find({}, { projection: { url: 1 } });
      const existingDocuments = await urlCursor.toArray();
      
      existingDocuments.forEach(doc => {
        if (doc.url) {
          existingUrls.add(doc.url);
        }
      });
      
      // Filter out duplicates
      const newJobs = validJobs.filter(job => !existingUrls.has(job.url));
      
      // Insert new jobs
      if (newJobs.length > 0) {
        // Add timestamps and IDs
        const jobsToInsert = newJobs.map(job => ({
          ...job,
          created_at: new Date(),
          updated_at: new Date()
        }));
        
        // Insert the jobs
        const result = await collection.insertMany(jobsToInsert);
        
        logger.info(`Saved ${result.insertedCount} new jobs to database`);
        return {
          saved: result.insertedCount,
          duplicates: validJobs.length - newJobs.length
        };
      } else {
        logger.info(`No new jobs to save, all ${validJobs.length} jobs were duplicates`);
        return {
          saved: 0,
          duplicates: validJobs.length
        };
      }
    } catch (error) {
      logger.error(`Error saving jobs to database: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Extract plain text from HTML/markdown
   * @param {string} html - HTML or markdown content
   * @returns {string} - Plain text
   * @private
   */
  _extractTextFromHtml(html) {
    if (!html) return '';
    
    // Simple HTML tag removal (for more complex cases, use a proper parser)
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = AdminDataEntryScraper; 