const logger = require('../utils/logger');
const { 
  cleanText, 
  extractSalary, 
  parseRelativeDate, 
  isLikelyRemote,
  makeAbsoluteUrl 
} = require('../utils/helpers');

/**
 * Newsletter monitoring system for RemoteJobs.com
 * This class handles newsletter subscription and email parsing
 */
class RemoteJobsNewsletterMonitor {
  constructor(config = {}) {
    this.config = {
      emailProvider: config.emailProvider || 'gmail', // gmail, outlook, etc.
      checkInterval: config.checkInterval || 3600000, // 1 hour in milliseconds
      maxEmailsToCheck: config.maxEmailsToCheck || 10,
      ...config
    };
    
    this.baseUrl = 'https://remotejobs.com';
    this.newsletterEmail = 'noreply@remotejobs.com'; // Typical sender
    this.isMonitoring = false;
  }

  /**
   * Subscribe to RemoteJobs.com newsletter
   * This would need to be done manually or through their API if available
   */
  async subscribeToNewsletter(email) {
    try {
      logger.info(`Attempting to subscribe ${email} to RemoteJobs.com newsletter`);
      
      // Note: This would typically require manual subscription
      // or integration with their newsletter service
      
      const subscriptionInfo = {
        email: email,
        subscriptionUrl: 'https://remotejobs.com/#subscribe',
        instructions: [
          '1. Visit https://remotejobs.com',
          '2. Scroll to the newsletter subscription section',
          '3. Enter your email address',
          '4. Click Subscribe',
          '5. Confirm subscription in your email'
        ],
        automationNote: 'For automation, you would need to integrate with their newsletter service API or use email monitoring'
      };
      
      logger.info('Newsletter subscription information:');
      logger.info(JSON.stringify(subscriptionInfo, null, 2));
      
      return subscriptionInfo;
      
    } catch (error) {
      logger.error(`Failed to subscribe to newsletter: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse job listings from newsletter email content
   */
  parseNewsletterJobs(emailContent, emailDate = new Date()) {
    try {
      logger.info('Parsing jobs from newsletter email content');
      
      const jobs = [];
      
      // Common patterns in job newsletter emails
      const jobPatterns = [
        // Pattern: Company—Job Title Location Time ago Salary,Type,Category
        /([^—\n]+)—([^—\n]+?)\s+(North America|Europe|Asia|Africa|Australia|South America|Remote)\s+(\d+\s+(?:hour|day|week|month)s?\s+ago)\s+([^,\n]+)/gi,
        
        // Pattern: **Job Title** at Company (Location) - Salary
        /\*\*([^*]+)\*\*\s+at\s+([^(]+)\s*\(([^)]+)\)\s*-?\s*([^,\n]*)/gi,
        
        // Pattern: Job Title - Company - Location - Salary
        /^([^-\n]+)\s*-\s*([^-\n]+)\s*-\s*([^-\n]+)\s*-?\s*([^,\n]*)/gm
      ];
      
      for (const pattern of jobPatterns) {
        let match;
        while ((match = pattern.exec(emailContent)) !== null) {
          try {
            const job = this.extractJobFromMatch(match, emailDate);
            if (job && job.title && job.company) {
              jobs.push(job);
            }
          } catch (error) {
            logger.debug(`Error parsing job match: ${error.message}`);
          }
        }
      }
      
      // Also look for URLs that might be job links
      const urlPattern = /https?:\/\/remotejobs\.com\/[^\s<>"]+/gi;
      const urls = emailContent.match(urlPattern) || [];
      
      // If we found URLs but no jobs, try to extract from URL structure
      if (jobs.length === 0 && urls.length > 0) {
        urls.forEach(url => {
          const job = this.extractJobFromUrl(url, emailDate);
          if (job) {
            jobs.push(job);
          }
        });
      }
      
      logger.info(`Parsed ${jobs.length} jobs from newsletter email`);
      return this.removeDuplicates(jobs);
      
    } catch (error) {
      logger.error(`Error parsing newsletter jobs: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract job information from regex match
   */
  extractJobFromMatch(match, emailDate) {
    try {
      let company, title, location, timeAgo, salary;
      
      // Different patterns have different group arrangements
      if (match.length >= 6) {
        // Pattern 1: Company—Job Title Location Time ago Salary
        [, company, title, location, timeAgo, salary] = match;
      } else if (match.length >= 5) {
        // Pattern 2: **Job Title** at Company (Location) - Salary
        [, title, company, location, salary] = match;
      } else if (match.length >= 4) {
        // Pattern 3: Job Title - Company - Location - Salary
        [, title, company, location, salary] = match;
      }
      
      // Clean up extracted data
      company = cleanText(company || '');
      title = cleanText(title || '');
      location = cleanText(location || 'Remote');
      salary = cleanText(salary || '');
      
      // Parse posted date
      let postedDate = emailDate;
      if (timeAgo) {
        postedDate = parseRelativeDate(timeAgo);
      }
      
      // Create job object
      const job = {
        title: title,
        company: company,
        location: location,
        url: '', // Will be filled if we can match to a URL
        description: `Job from RemoteJobs.com newsletter: ${title} at ${company}`,
        descriptionText: `Job from RemoteJobs.com newsletter: ${title} at ${company}`,
        salary: extractSalary(salary) || salary,
        source: 'remotejobs.com-newsletter',
        postedDate: postedDate,
        credibilityScore: 9, // Newsletter jobs are typically high quality
        isRemote: true, // All RemoteJobs.com jobs should be remote
        newsletterDate: emailDate
      };
      
      return job;
      
    } catch (error) {
      logger.debug(`Error extracting job from match: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract job information from URL structure
   */
  extractJobFromUrl(url, emailDate) {
    try {
      // RemoteJobs.com URLs might be like: https://remotejobs.com/jobs/company-job-title
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      
      if (lastPart && lastPart.includes('-')) {
        const parts = lastPart.split('-');
        const company = parts[0] || 'Unknown Company';
        const title = parts.slice(1).join(' ') || 'Unknown Title';
        
        const job = {
          title: cleanText(title.replace(/-/g, ' ')),
          company: cleanText(company.replace(/-/g, ' ')),
          location: 'Remote',
          url: url,
          description: `Job from RemoteJobs.com newsletter URL: ${url}`,
          descriptionText: `Job from RemoteJobs.com newsletter URL: ${url}`,
          salary: '',
          source: 'remotejobs.com-newsletter',
          postedDate: emailDate,
          credibilityScore: 8,
          isRemote: true,
          newsletterDate: emailDate
        };
        
        return job;
      }
      
      return null;
      
    } catch (error) {
      logger.debug(`Error extracting job from URL: ${error.message}`);
      return null;
    }
  }

  /**
   * Remove duplicate jobs
   */
  removeDuplicates(jobs) {
    const seen = new Set();
    const unique = [];
    
    for (const job of jobs) {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(job);
      }
    }
    
    return unique;
  }

  /**
   * Mock email monitoring (for demonstration)
   * In production, this would integrate with email APIs
   */
  async startMonitoring(emailConfig) {
    try {
      logger.info('Starting newsletter monitoring (mock implementation)');
      
      this.isMonitoring = true;
      
      const monitoringInfo = {
        status: 'monitoring',
        emailProvider: this.config.emailProvider,
        checkInterval: this.config.checkInterval,
        implementation: 'mock',
        realImplementationNotes: [
          'For Gmail: Use Gmail API with OAuth2 authentication',
          'For Outlook: Use Microsoft Graph API',
          'For IMAP: Use node-imap library',
          'Filter emails by sender: noreply@remotejobs.com',
          'Parse email content for job listings',
          'Store processed email IDs to avoid duplicates'
        ],
        sampleEmailParsing: this.demonstrateEmailParsing()
      };
      
      logger.info('Newsletter monitoring started (mock mode)');
      logger.info(JSON.stringify(monitoringInfo, null, 2));
      
      return monitoringInfo;
      
    } catch (error) {
      logger.error(`Failed to start monitoring: ${error.message}`);
      throw error;
    }
  }

  /**
   * Demonstrate email parsing with sample content
   */
  demonstrateEmailParsing() {
    const sampleEmailContent = `
      Subject: The Week's Latest Remote Jobs - RemoteJobs.com

      Hi there!

      Here are this week's latest remote job opportunities:

      Hypermode—Senior/Staff Front-end Engineer North America 1 hour ago $100k+,Full-time,Development

      Altium—Senior Product Marketing Manager North America 6 hours ago $100k+,Full-time,Marketing

      GR0—Freelance Ad Designer North America 2 days ago $50k-$75k,Freelance,Design

      Rula—Director of Finance Systems North America 2 days ago $100k+,Full-time,Finance

      View all jobs: https://remotejobs.com

      Best regards,
      The RemoteJobs.com Team
    `;
    
    const parsedJobs = this.parseNewsletterJobs(sampleEmailContent);
    
    return {
      sampleContent: sampleEmailContent,
      parsedJobs: parsedJobs,
      jobCount: parsedJobs.length
    };
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    logger.info('Newsletter monitoring stopped');
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      lastCheck: new Date().toISOString()
    };
  }
}

module.exports = RemoteJobsNewsletterMonitor; 