import sgMail from '@sendgrid/mail';
import type { Job } from '../types/job';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'hi@clickclickjob.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'ClickClickJob Team';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

function generateDigestHtml(jobs: Job[]): string {
  const jobsHtml = jobs.map(job => {
    const jobPageUrl = `https://clickclickjob.com/jobs/view/${job._id}`;
    return `
    <div style="margin-bottom: 24px; padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
      <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; line-height: 1.4;">
        <a href="${jobPageUrl}" style="color: #1f2937; text-decoration: none;" target="_blank">${job.title}</a>
      </h3>
      <div style="margin-bottom: 16px; font-size: 14px; color: #6b7280;">
        <span>🏢 ${job.company}</span>
        ${job.location ? ` • 📍 ${job.location}` : ''}
      </div>
      ${job.description ? `
        <p style="margin: 0 0 20px 0; color: #4b5563; line-height: 1.6; font-size: 15px;">
          ${job.description.substring(0, 200)}...
        </p>
      ` : ''}
      <a href="${jobPageUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; font-weight: 600; border-radius: 8px; text-decoration: none; font-size: 14px;" target="_blank">
        View Job Details →
      </a>
    </div>
  `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Weekly Remote Job Digest | ClickClickJob.com</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Header -->
    <div style="background-color: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e5e7eb; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #2563eb;">
        ClickClick<span style="color: #f97316;">Job.com</span>
      </h1>
      <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Weekly Remote Job Digest</p>
    </div>
    
    <!-- Hero -->
    <div style="background: linear-gradient(to bottom, #eff6ff, #ffffff); padding: 40px 24px; text-align: center; border-bottom: 1px solid #dbeafe;">
      <h2 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #1f2937;">
        New Remote Jobs This Week
      </h2>
      <p style="margin: 0; font-size: 18px; color: #4b5563;">
        Fresh remote opportunities curated just for you
      </p>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px 24px;">
      <p style="margin: 0 0 32px 0; font-size: 16px; color: #4b5563;">
        Hi there! 👋<br><br>
        Here are <strong>${jobs.length} new remote job opportunities</strong> we've found for you this week. All positions are verified and legitimate.
      </p>
      
      ${jobsHtml}
      
      <!-- CTA -->
      <div style="margin-top: 40px; padding: 32px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 12px; text-align: center;">
        <h3 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff;">
          Want More Job Opportunities?
        </h3>
        <p style="margin: 0 0 24px 0; color: #dbeafe; font-size: 16px;">
          Browse hundreds of verified remote positions on our website
        </p>
        <a href="https://clickclickjob.com/jobs" style="display: inline-block; padding: 16px 32px; background-color: #ffffff; color: #2563eb; font-weight: 600; border-radius: 8px; text-decoration: none; font-size: 16px;" target="_blank">
          Browse All Jobs →
        </a>
      </div>
      
      <!-- Tips -->
      <div style="margin-top: 32px; padding: 24px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #2563eb;">
        <h4 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #1f2937;">
          💡 Application Tips
        </h4>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.6;">
          <li style="margin-bottom: 8px;">Apply quickly - remote jobs often receive many applications</li>
          <li style="margin-bottom: 8px;">Customize your resume for each position</li>
          <li style="margin-bottom: 8px;">Highlight your remote work experience and skills</li>
          <li>Be wary of scams - legitimate employers won't ask for money upfront</li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 32px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      
      <!-- See All Jobs Button -->
      <div style="margin-bottom: 32px;">
        <a href="https://www.clickclickjob.com/jobs" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; font-weight: 600; border-radius: 8px; text-decoration: none; font-size: 16px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);" target="_blank">
          🔍 See All Jobs
        </a>
      </div>
      
      <div style="margin-bottom: 24px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
          Stay Connected
        </p>
        <div style="display: inline-flex; gap: 16px;">
          <a href="https://clickclickjob.com" style="color: #2563eb; text-decoration: none; font-size: 14px;">Website</a>
          <a href="https://clickclickjob.com/jobs" style="color: #2563eb; text-decoration: none; font-size: 14px;">Browse Jobs</a>
          <a href="https://clickclickjob.com/about" style="color: #2563eb; text-decoration: none; font-size: 14px;">About</a>
        </div>
      </div>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
          You're receiving this email because you subscribed to our weekly remote job digest.<br>
          All jobs are verified for legitimacy, but always use caution when applying.
        </p>
        <div style="margin-top: 16px;">
          <a href="https://clickclickjob.com/unsubscribe" style="color: #6b7280; text-decoration: underline; font-size: 12px;">Unsubscribe</a>
          <span style="color: #d1d5db; margin: 0 8px;">|</span>
          <a href="https://clickclickjob.com/privacy-policy" style="color: #6b7280; text-decoration: underline; font-size: 12px;">Privacy Policy</a>
        </div>
        <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">
          © ${new Date().getFullYear()} ClickClickJob.com • All rights reserved
        </p>
      </div>
    </div>
    
  </div>
</body>
</html>
  `;
}

function generateDigestText(jobs: Job[]): string {
  const jobsText = jobs.map((job, i) => {
    const jobPageUrl = `https://clickclickjob.com/jobs/view/${job._id}`;
    return `
${i + 1}. ${job.title}
   Company: ${job.company}
   ${job.location ? `Location: ${job.location}` : ''}
   View: ${jobPageUrl}
   ${job.description ? `\n   ${job.description.substring(0, 150)}...\n` : ''}
  `;
  }).join('\n');

  return `
ClickClickJob - Your Weekly Remote Jobs Digest

Hi there!

Here are ${jobs.length} new remote job opportunities we found for you this week:

${jobsText}

Want to see more jobs? Visit https://clickclickjob.com

---
You're receiving this because you subscribed to ClickClickJob weekly digest.
Unsubscribe: https://clickclickjob.com/unsubscribe
  `;
}

export async function sendWeeklyDigestViaSendGrid(
  jobs: Job[],
  subscriberEmails: string[]
): Promise<void> {
  if (!SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  if (subscriberEmails.length === 0) {
    console.log('No subscribers to send to');
    return;
  }

  const today = new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  const emailHtml = generateDigestHtml(jobs);
  const emailText = generateDigestText(jobs);

  const msg = {
    to: subscriberEmails,
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: SENDGRID_FROM_NAME
    },
    subject: `🔔 ${jobs.length} New Remote Jobs This Week - ${today}`,
    text: emailText,
    html: emailHtml,
    trackingSettings: {
      clickTracking: {
        enable: true,
        enableText: false
      },
      openTracking: {
        enable: true
      }
    }
  };

  try {
    console.log(`📧 Sending digest to ${subscriberEmails.length} subscribers via SendGrid...`);
    await sgMail.send(msg);
    console.log(`✅ Email sent successfully!`);
    console.log(`   From: ${SENDGRID_FROM_NAME} <${SENDGRID_FROM_EMAIL}>`);
    console.log(`   To: ${subscriberEmails.length} subscribers`);
    console.log(`   Jobs: ${jobs.length}`);
  } catch (error: any) {
    console.error('❌ SendGrid error:', error);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
    throw error;
  }
}

export async function sendTestEmailViaSendGrid(recipientEmail: string): Promise<void> {
  if (!SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  const msg = {
    to: recipientEmail,
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: SENDGRID_FROM_NAME
    },
    subject: '✅ Test Email - ClickClickJob SendGrid Integration',
    text: 'This is a test email from ClickClickJob. If you\'re reading this, the SendGrid integration is working!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #2563eb;">✅ Test Email Success!</h1>
        <p style="font-size: 16px; color: #374151;">
          This is a test email from <strong>ClickClickJob</strong>.
        </p>
        <p style="font-size: 16px; color: #374151;">
          If you're reading this, the SendGrid integration is working perfectly! 🎉
        </p>
        <div style="margin-top: 32px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            <strong>From:</strong> ${SENDGRID_FROM_NAME} &lt;${SENDGRID_FROM_EMAIL}&gt;<br>
            <strong>Service:</strong> SendGrid<br>
            <strong>Status:</strong> ✅ Working
          </p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Test email sent to ${recipientEmail}`);
  } catch (error: any) {
    console.error('❌ Failed to send test email:', error);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
    throw error;
  }
}
