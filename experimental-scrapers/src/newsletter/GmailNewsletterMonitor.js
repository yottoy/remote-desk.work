const { google } = require('googleapis');
const RemoteJobsNewsletterMonitor = require('./RemoteJobsNewsletterMonitor');
const logger = require('../utils/logger');

/**
 * Gmail API integration for automated newsletter monitoring
 * Requires Gmail API credentials and OAuth2 setup
 */
class GmailNewsletterMonitor extends RemoteJobsNewsletterMonitor {
  constructor(config = {}) {
    super(config);
    
    this.gmail = null;
    this.auth = null;
    this.credentials = config.credentials || null; // Gmail API credentials
    this.token = config.token || null; // OAuth2 token
  }

  /**
   * Initialize Gmail API connection
   */
  async initializeGmail() {
    try {
      if (!this.credentials) {
        throw new Error('Gmail API credentials not provided');
      }

      // Set up OAuth2 client
      const { client_secret, client_id, redirect_uris } = this.credentials.installed;
      this.auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      if (this.token) {
        this.auth.setCredentials(this.token);
      } else {
        throw new Error('OAuth2 token not provided. Run authentication flow first.');
      }

      // Initialize Gmail API
      this.gmail = google.gmail({ version: 'v1', auth: this.auth });
      
      logger.info('✅ Gmail API initialized successfully');
      return true;
      
    } catch (error) {
      logger.error(`❌ Failed to initialize Gmail API: ${error.message}`);
      return false;
    }
  }

  /**
   * Get authentication URL for OAuth2 flow
   */
  getAuthUrl() {
    if (!this.auth) {
      throw new Error('OAuth2 client not initialized');
    }

    const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
    
    const authUrl = this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokenFromCode(code) {
    try {
      const { tokens } = await this.auth.getToken(code);
      this.auth.setCredentials(tokens);
      this.token = tokens;
      
      logger.info('✅ OAuth2 tokens obtained successfully');
      return tokens;
      
    } catch (error) {
      logger.error(`❌ Failed to get tokens: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for RemoteJobs.com newsletter emails
   */
  async searchNewsletterEmails(maxResults = 10) {
    try {
      if (!this.gmail) {
        throw new Error('Gmail API not initialized');
      }

      // Search for emails from RemoteJobs.com
      const query = 'from:remotejobs.com OR from:noreply@remotejobs.com subject:"remote jobs"';
      
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults
      });

      const messages = response.data.messages || [];
      logger.info(`Found ${messages.length} newsletter emails`);
      
      return messages;
      
    } catch (error) {
      logger.error(`❌ Failed to search emails: ${error.message}`);
      return [];
    }
  }

  /**
   * Get email content and parse jobs
   */
  async processNewsletterEmail(messageId) {
    try {
      if (!this.gmail) {
        throw new Error('Gmail API not initialized');
      }

      // Get email details
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.data;
      const headers = message.payload.headers;
      
      // Extract email metadata
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      logger.info(`Processing email: ${subject}`);
      logger.info(`From: ${from}`);
      logger.info(`Date: ${date}`);

      // Extract email body
      let emailContent = '';
      
      if (message.payload.body.data) {
        // Simple text email
        emailContent = Buffer.from(message.payload.body.data, 'base64').toString();
      } else if (message.payload.parts) {
        // Multi-part email
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            if (part.body.data) {
              const partContent = Buffer.from(part.body.data, 'base64').toString();
              emailContent += partContent + '\n';
            }
          }
        }
      }

      if (!emailContent) {
        logger.warn('No email content found');
        return [];
      }

      // Parse jobs from email content
      const emailDate = new Date(date);
      const jobs = this.parseNewsletterJobs(emailContent, emailDate);
      
      logger.info(`Extracted ${jobs.length} jobs from email`);
      return jobs;
      
    } catch (error) {
      logger.error(`❌ Failed to process email: ${error.message}`);
      return [];
    }
  }

  /**
   * Monitor for new newsletter emails and process them
   */
  async startAutomatedMonitoring() {
    try {
      const initialized = await this.initializeGmail();
      if (!initialized) {
        throw new Error('Failed to initialize Gmail API');
      }

      logger.info('🔄 Starting automated newsletter monitoring');
      
      this.isMonitoring = true;
      
      const checkForEmails = async () => {
        if (!this.isMonitoring) return;
        
        try {
          logger.info('📧 Checking for new newsletter emails...');
          
          const messages = await this.searchNewsletterEmails(5);
          const allJobs = [];
          
          for (const message of messages) {
            const jobs = await this.processNewsletterEmail(message.id);
            allJobs.push(...jobs);
            
            // Delay between processing emails
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          if (allJobs.length > 0) {
            logger.info(`📊 Found ${allJobs.length} total jobs from newsletters`);
            
            // Save results
            const fs = require('fs');
            const path = require('path');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `newsletter-jobs-${timestamp}.json`;
            const filepath = path.join(__dirname, '../../results', filename);
            
            fs.writeFileSync(filepath, JSON.stringify({
              metadata: {
                scrapedAt: new Date().toISOString(),
                source: 'remotejobs.com-newsletter',
                totalJobs: allJobs.length,
                method: 'gmail-api'
              },
              jobs: allJobs
            }, null, 2));
            
            logger.info(`💾 Newsletter jobs saved to: ${filepath}`);
          }
          
        } catch (error) {
          logger.error(`❌ Error checking emails: ${error.message}`);
        }
      };
      
      // Initial check
      await checkForEmails();
      
      // Schedule regular checks
      const intervalId = setInterval(checkForEmails, this.config.checkInterval);
      
      logger.info(`✅ Automated monitoring started (checking every ${this.config.checkInterval / 1000 / 60} minutes)`);
      
      return intervalId;
      
    } catch (error) {
      logger.error(`❌ Failed to start automated monitoring: ${error.message}`);
      throw error;
    }
  }

  /**
   * Setup instructions for Gmail API
   */
  static getSetupInstructions() {
    return {
      title: 'Gmail API Setup for Newsletter Monitoring',
      steps: [
        '1. Go to Google Cloud Console (https://console.cloud.google.com/)',
        '2. Create a new project or select existing one',
        '3. Enable Gmail API for your project',
        '4. Create credentials (OAuth 2.0 Client ID)',
        '5. Download credentials.json file',
        '6. Run authentication flow to get tokens',
        '7. Configure GmailNewsletterMonitor with credentials and tokens'
      ],
      codeExample: `
// Example usage:
const monitor = new GmailNewsletterMonitor({
  credentials: require('./credentials.json'),
  token: require('./token.json'),
  checkInterval: 3600000 // 1 hour
});

await monitor.startAutomatedMonitoring();
      `,
      notes: [
        'Requires Google Cloud project with Gmail API enabled',
        'OAuth2 authentication required',
        'Tokens need to be refreshed periodically',
        'Rate limits apply to Gmail API calls'
      ]
    };
  }
}

module.exports = GmailNewsletterMonitor; 