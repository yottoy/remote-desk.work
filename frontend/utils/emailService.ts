/**
 * Email Service using Nodemailer (works on all plans)
 * Sends directly via SMTP instead of MailerLite API
 */

import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  throw new Error('EMAIL_USER and EMAIL_PASS must be configured in .env.local');
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

export interface JobForEmail {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
  postedDate?: Date;
}

/**
 * Send weekly digest email to subscribers
 */
export async function sendWeeklyDigestDirect(
  jobs: JobForEmail[],
  subscribers: string[]
): Promise<void> {
  if (subscribers.length === 0) {
    console.log('No subscribers to send to');
    return;
  }

  if (jobs.length === 0) {
    console.log('No jobs to send');
    return;
  }

  const emailHtml = generateDigestHTML(jobs);
  
  // Send to each subscriber individually (with BCC for privacy)
  const mailOptions = {
    from: `ClickClickJob Team <${EMAIL_USER}>`,
    bcc: subscribers, // Use BCC so subscribers don't see each other's emails
    subject: `🔔 ${jobs.length} New Remote Jobs This Week - ${new Date().toLocaleDateString()}`,
    html: emailHtml,
    text: generateDigestText(jobs)
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Digest sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Recipients: ${subscribers.length} subscribers`);
  } catch (error) {
    console.error('❌ Failed to send digest:', error);
    throw error;
  }
}

/**
 * Send test email to verify configuration
 */
export async function sendTestEmail(recipientEmail: string): Promise<void> {
  const mailOptions = {
    from: `ClickClickJob Team <${EMAIL_USER}>`,
    to: recipientEmail,
    subject: '✅ Test Email - Your ClickClickJob Integration Works!',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px;">
            <h1 style="color: #2563eb;">🎉 Success!</h1>
            <p style="font-size: 16px; color: #374151;">
              Your email integration is working correctly! This test email confirms:
            </p>
            <ul style="font-size: 15px; color: #4b5563; line-height: 1.8;">
              <li>✅ SMTP connection successful</li>
              <li>✅ Email credentials valid</li>
              <li>✅ Emails can be sent to subscribers</li>
            </ul>
            <div style="margin-top: 30px; padding: 20px; background-color: #dbeafe; border-radius: 6px;">
              <p style="margin: 0; font-weight: bold; color: #1e40af;">Your weekly digest is ready!</p>
              <p style="margin: 10px 0 0 0; color: #1e3a8a;">
                The cron job will automatically send job updates every Monday at 2 PM UTC.
              </p>
            </div>
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
              Test sent: ${new Date().toLocaleString()}
            </p>
          </div>
        </body>
      </html>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Test email sent!');
  console.log(`   To: ${recipientEmail}`);
  console.log(`   Message ID: ${info.messageId}`);
}

function generateDigestHTML(jobs: JobForEmail[]): string {
  const jobsHtml = jobs.map(job => `
    <div style="margin-bottom: 24px; padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #1f2937;">
        ${job.title}
      </h3>
      <div style="margin-bottom: 12px; font-size: 14px; color: #6b7280;">
        <span>🏢 ${job.company}</span>
        <span style="margin-left: 16px;">📍 ${job.location}</span>
        ${job.salary ? `<span style="margin-left: 16px;">💰 ${job.salary}</span>` : ''}
      </div>
      <p style="margin: 0 0 20px 0; color: #4b5563; line-height: 1.6;">
        ${job.description.substring(0, 200)}...
      </p>
      <a href="${job.url}" 
         style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Apply Now →
      </a>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="padding: 32px 24px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; color: #2563eb;">ClickClick<span style="color: #f97316;">Job</span></h1>
            <p style="margin: 8px 0 0 0; color: #6b7280;">Weekly Remote Job Digest</p>
          </div>
          
          <div style="padding: 40px 24px; text-align: center; background: linear-gradient(to bottom, #eff6ff, #ffffff);">
            <h2 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #1f2937;">
              ${jobs.length} New Remote Jobs
            </h2>
            <p style="margin: 0; font-size: 18px; color: #4b5563;">
              Fresh opportunities for you this week
            </p>
          </div>
          
          <div style="padding: 32px 24px;">
            ${jobsHtml}
            
            <div style="margin-top: 40px; padding: 32px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 12px; text-align: center;">
              <h3 style="margin: 0 0 16px 0; font-size: 24px; color: white;">Want More Jobs?</h3>
              <a href="https://www.clickclickjob.com/jobs" 
                 style="display: inline-block; padding: 16px 32px; background-color: white; color: #2563eb; font-weight: 600; border-radius: 8px; text-decoration: none;">
                Browse All Jobs
              </a>
            </div>
          </div>
          
          <div style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              You're receiving this because you subscribed to ClickClickJob.com
            </p>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">
              <a href="[UNSUBSCRIBE]" style="color: #6b7280;">Unsubscribe</a> | 
              <a href="https://www.clickclickjob.com/privacy-policy" style="color: #6b7280;">Privacy Policy</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateDigestText(jobs: JobForEmail[]): string {
  const jobsText = jobs.map(job => `
${job.title}
Company: ${job.company}
Location: ${job.location}
${job.salary ? `Salary: ${job.salary}` : ''}

${job.description.substring(0, 150)}...

Apply: ${job.url}
---
  `).join('\n');

  return `
ClickClickJob.com - Weekly Remote Job Digest

${jobs.length} New Remote Jobs This Week

${jobsText}

Browse more jobs: https://www.clickclickjob.com/jobs

---
You're receiving this email because you subscribed to ClickClickJob.com
Unsubscribe: [UNSUBSCRIBE]
  `;
}
