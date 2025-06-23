const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the email service
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create transporter based on environment
      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Verify connection
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.verify();
        logger.info('Email service initialized successfully');
      } else {
        logger.warn('Email credentials not configured, using test mode');
      }

      this.isInitialized = true;
    } catch (error) {
      logger.error(`Failed to initialize email service: ${error.message}`);
      // Don't throw error, fall back to console logging
      this.isInitialized = true;
    }
  }

  /**
   * Send verification email
   * @param {Object} subscription - Subscription object
   */
  async sendVerificationEmail(subscription) {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${subscription.verificationToken}`;
      
      const htmlContent = this.generateVerificationEmailHtml(subscription, verificationUrl);
      const textContent = this.generateVerificationEmailText(subscription, verificationUrl);

      const mailOptions = {
        from: `"ClickClickJob" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: subscription.email,
        subject: 'Verify Your Job Alert Subscription',
        text: textContent,
        html: htmlContent
      };

      await this.sendEmail(mailOptions);
      logger.info(`Verification email sent to: ${subscription.email}`);

    } catch (error) {
      logger.error(`Failed to send verification email to ${subscription.email}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send job alert email
   * @param {Object} subscription - Subscription object
   * @param {Array} jobs - Matching jobs
   * @param {boolean} isTest - Whether this is a test email
   */
  async sendJobAlertEmail(subscription, jobs, isTest = false) {
    try {
      const subject = isTest 
        ? `Test Job Alert: ${jobs.length} Remote Admin Jobs`
        : `${jobs.length} New Remote Admin Jobs Matching Your Preferences`;

      const htmlContent = this.generateJobAlertEmailHtml(subscription, jobs, isTest);
      const textContent = this.generateJobAlertEmailText(subscription, jobs, isTest);

      const mailOptions = {
        from: `"ClickClickJob" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: subscription.email,
        subject: subject,
        text: textContent,
        html: htmlContent
      };

      await this.sendEmail(mailOptions);
      logger.info(`Job alert email sent to: ${subscription.email} (${jobs.length} jobs)`);

    } catch (error) {
      logger.error(`Failed to send job alert email to ${subscription.email}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send email using transporter or log to console
   * @param {Object} mailOptions - Email options
   */
  async sendEmail(mailOptions) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.transporter && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await this.transporter.sendMail(mailOptions);
    } else {
      // Fallback to console logging in development
      logger.info('EMAIL WOULD BE SENT:');
      logger.info(`To: ${mailOptions.to}`);
      logger.info(`Subject: ${mailOptions.subject}`);
      logger.info(`Content: ${mailOptions.text.substring(0, 200)}...`);
    }
  }

  /**
   * Generate verification email HTML
   * @param {Object} subscription - Subscription object
   * @param {string} verificationUrl - Verification URL
   * @returns {string} HTML content
   */
  generateVerificationEmailHtml(subscription, verificationUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to ClickClickJob!</h1>
            </div>
            <div class="content">
                <h2>Hi ${subscription.firstName}!</h2>
                <p>Thank you for subscribing to our job alerts. To complete your subscription and start receiving personalized remote administrative job opportunities, please verify your email address.</p>
                
                <p><strong>Your preferences:</strong></p>
                <ul>
                    <li>Frequency: ${subscription.frequency}</li>
                    <li>Remote only: ${subscription.preferences.remoteOnly ? 'Yes' : 'No'}</li>
                    ${subscription.preferences.keywords.length > 0 ? `<li>Keywords: ${subscription.preferences.keywords.join(', ')}</li>` : ''}
                    ${subscription.preferences.salaryRange.min || subscription.preferences.salaryRange.max ? `<li>Salary range: $${subscription.preferences.salaryRange.min || 0} - $${subscription.preferences.salaryRange.max || 'unlimited'}</li>` : ''}
                </ul>

                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </div>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p><a href="${verificationUrl}">${verificationUrl}</a></p>
                
                <p>If you didn't sign up for job alerts, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>ClickClickJob - Your Remote Admin Career Partner</p>
                <p><a href="${process.env.FRONTEND_URL}">Visit our website</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate verification email text
   * @param {Object} subscription - Subscription object
   * @param {string} verificationUrl - Verification URL
   * @returns {string} Text content
   */
  generateVerificationEmailText(subscription, verificationUrl) {
    return `
Welcome to ClickClickJob!

Hi ${subscription.firstName},

Thank you for subscribing to our job alerts. To complete your subscription and start receiving personalized remote administrative job opportunities, please verify your email address.

Your preferences:
- Frequency: ${subscription.frequency}
- Remote only: ${subscription.preferences.remoteOnly ? 'Yes' : 'No'}
${subscription.preferences.keywords.length > 0 ? `- Keywords: ${subscription.preferences.keywords.join(', ')}` : ''}
${subscription.preferences.salaryRange.min || subscription.preferences.salaryRange.max ? `- Salary range: $${subscription.preferences.salaryRange.min || 0} - $${subscription.preferences.salaryRange.max || 'unlimited'}` : ''}

Verify your email: ${verificationUrl}

If you didn't sign up for job alerts, you can safely ignore this email.

ClickClickJob - Your Remote Admin Career Partner
${process.env.FRONTEND_URL}
    `;
  }

  /**
   * Generate job alert email HTML
   * @param {Object} subscription - Subscription object
   * @param {Array} jobs - Job array
   * @param {boolean} isTest - Whether this is a test email
   * @returns {string} HTML content
   */
  generateJobAlertEmailHtml(subscription, jobs, isTest) {
    const testBadge = isTest ? '<div style="background: #FEF3C7; color: #92400E; padding: 10px; text-align: center; font-weight: bold;">TEST EMAIL</div>' : '';
    
    const jobsHtml = jobs.map(job => `
        <div style="border: 1px solid #E5E7EB; margin: 20px 0; padding: 20px; border-radius: 8px; background: white;">
            <h3 style="margin: 0 0 10px 0; color: #1F2937;">${job.title}</h3>
            <p style="margin: 5px 0; color: #6B7280;"><strong>Company:</strong> ${job.company}</p>
            ${job.location ? `<p style="margin: 5px 0; color: #6B7280;"><strong>Location:</strong> ${job.location}</p>` : ''}
            ${job.salary ? `<p style="margin: 5px 0; color: #6B7280;"><strong>Salary:</strong> ${job.salary}</p>` : ''}
            <p style="margin: 10px 0; color: #4B5563;">${job.description ? job.description.substring(0, 200) + '...' : 'No description available'}</p>
            ${job.url ? `<a href="${job.url}" style="background: #4F46E5; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px;">View Job</a>` : ''}
        </div>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Your Job Alert</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #F3F4F6; margin: 0; padding: 0; }
            .container { max-width: 700px; margin: 0 auto; background: white; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; background: #F9FAFB; }
            .unsubscribe { margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB; }
        </style>
    </head>
    <body>
        <div class="container">
            ${testBadge}
            <div class="header">
                <h1>New Job Opportunities</h1>
                <p>We found ${jobs.length} job${jobs.length !== 1 ? 's' : ''} matching your preferences</p>
            </div>
            <div class="content">
                <h2>Hi ${subscription.firstName}!</h2>
                <p>Here are the latest remote administrative job opportunities that match your preferences:</p>
                
                ${jobsHtml}
                
                <div class="unsubscribe">
                    <p><strong>Manage your preferences:</strong></p>
                    <p><a href="${process.env.FRONTEND_URL}/job-alerts/preferences/${subscription._id}">Update preferences</a> | 
                       <a href="${process.env.FRONTEND_URL}/job-alerts/unsubscribe?email=${encodeURIComponent(subscription.email)}">Unsubscribe</a></p>
                </div>
            </div>
            <div class="footer">
                <p>ClickClickJob - Your Remote Admin Career Partner</p>
                <p><a href="${process.env.FRONTEND_URL}">Visit our website</a></p>
                <p>This email was sent to ${subscription.email} based on your job alert preferences.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate job alert email text
   * @param {Object} subscription - Subscription object
   * @param {Array} jobs - Job array
   * @param {boolean} isTest - Whether this is a test email
   * @returns {string} Text content
   */
  generateJobAlertEmailText(subscription, jobs, isTest) {
    const testPrefix = isTest ? '[TEST EMAIL] ' : '';
    
    const jobsText = jobs.map((job, index) => `
${index + 1}. ${job.title} at ${job.company}
   ${job.location ? `Location: ${job.location}` : ''}
   ${job.salary ? `Salary: ${job.salary}` : ''}
   ${job.description ? job.description.substring(0, 150) + '...' : ''}
   ${job.url ? `Apply: ${job.url}` : ''}
    `).join('\n');

    return `
${testPrefix}New Job Opportunities from ClickClickJob

Hi ${subscription.firstName}!

We found ${jobs.length} job${jobs.length !== 1 ? 's' : ''} matching your preferences:

${jobsText}

Manage your preferences: ${process.env.FRONTEND_URL}/job-alerts/preferences/${subscription._id}
Unsubscribe: ${process.env.FRONTEND_URL}/job-alerts/unsubscribe?email=${encodeURIComponent(subscription.email)}

ClickClickJob - Your Remote Admin Career Partner
${process.env.FRONTEND_URL}

This email was sent to ${subscription.email} based on your job alert preferences.
    `;
  }
}

// Export singleton instance
module.exports = new EmailService(); 