import { Job } from '../types/job';

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;

if (!MAILERLITE_API_KEY) {
  throw new Error('Please define the MAILERLITE_API_KEY environment variable inside .env.local');
}

if (!MAILERLITE_GROUP_ID) {
  throw new Error('Please define the MAILERLITE_GROUP_ID environment variable inside .env.local');
}

export async function sendDigest(jobs: Job[]) {
  if (jobs.length === 0) {
    console.log('No jobs to send in digest');
    return;
  }

  // Format jobs for email
  const formattedJobs = jobs
    .filter((job): job is Job & { title: string; company: string; url: string; description: string } => 
      Boolean(job.title && job.company && job.url && job.description)
    )
    .map(job => ({
      title: job.title,
      company: job.company,
      location: job.location || 'Remote',
      description: job.description,
      url: job.url
    }));

  // Create campaign using MailerLite API
  const response = await fetch('https://connect.mailerlite.com/api/campaigns', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      name: `Weekly Job Digest - ${new Date().toLocaleDateString()}`,
      type: 'regular',
      emails: [{
        subject: `New Remote Jobs This Week - ${new Date().toLocaleDateString()}`,
        from_name: 'ClickClickJob',
        from: 'hi@clickclickjob.com',
        content: generateEmailHtml(formattedJobs)
      }],
      groups: [MAILERLITE_GROUP_ID],
      // Schedule to send immediately
      delivery_schedule: {
        type: 'instant'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create campaign: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Digest email campaign created successfully:', result);
  
  // Send the campaign immediately using the correct endpoint
  if (result.data && result.data.id) {
    console.log('Attempting to send campaign immediately...');
    try {
      // Use the correct MailerLite API endpoint for sending campaigns
      const sendResponse = await fetch(`https://connect.mailerlite.com/api/campaigns/${result.data.id}/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          delivery: {
            type: 'instant'
          }
        })
      });

      if (sendResponse.ok) {
        const sendResult = await sendResponse.json();
        console.log('Campaign scheduled successfully:', sendResult);
      } else {
        const sendError = await sendResponse.text();
        console.error('Failed to schedule campaign:', sendResponse.status, sendError);
        
        // Try alternative endpoint if schedule doesn't work
        console.log('Trying alternative send endpoint...');
        const altSendResponse = await fetch(`https://connect.mailerlite.com/api/campaigns/${result.data.id}/actions/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (altSendResponse.ok) {
          const altSendResult = await altSendResponse.json();
          console.log('Campaign sent via alternative endpoint:', altSendResult);
        } else {
          const altSendError = await altSendResponse.text();
          console.error('Alternative send endpoint also failed:', altSendResponse.status, altSendError);
        }
      }
    } catch (sendError) {
      console.error('Error sending campaign:', sendError);
      // Don't throw error - campaign was created successfully even if sending failed
    }
  }
}

function generateEmailHtml(jobs: Array<{ title: string; company: string; location: string; description: string; url: string }>) {
  const jobsHtml = jobs.map(job => `
    <div style="margin-bottom: 24px; padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);">
      <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; line-height: 1.4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
        <a href="${job.url}" style="color: #1f2937; text-decoration: none; border-bottom: 2px solid transparent; transition: border-color 0.2s;" target="_blank">${job.title}</a>
      </h3>
      <div style="margin-bottom: 16px; display: flex; align-items: center; flex-wrap: wrap; gap: 16px; font-size: 14px; color: #6b7280;">
        <span style="display: inline-flex; align-items: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
          <svg width="16" height="16" style="margin-right: 6px; color: #9ca3af;" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.581.814L10 13.197l-4.419 2.617A1 1 0 014 15V4zm2-1a1 1 0 00-1 1v10.566l3.419-2.021a1 1 0 011.162 0L13 14.566V4a1 1 0 00-1-1H6z" clipRule="evenodd"/>
          </svg>
          ${job.company}
        </span>
        <span style="display: inline-flex; align-items: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
          <svg width="16" height="16" style="margin-right: 6px; color: #9ca3af;" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
          </svg>
          ${job.location}
        </span>
      </div>
      <p style="margin: 0 0 20px 0; color: #4b5563; line-height: 1.6; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">${job.description.substring(0, 200)}...</p>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="display: inline-flex; align-items: center; padding: 4px 12px; background-color: #dbeafe; color: #1e40af; border-radius: 20px; font-size: 12px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
          <svg width="12" height="12" style="margin-right: 4px;" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          Verified Job
        </span>
        <a href="${job.url}" 
           style="display: inline-flex; align-items: center; padding: 12px 24px; background-color: #2563eb; color: #ffffff; font-weight: 600; border-radius: 8px; text-decoration: none; font-size: 14px; transition: background-color 0.2s; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;" 
           target="_blank">
          Apply Now
          <svg width="16" height="16" style="margin-left: 8px;" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </a>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Weekly Remote Job Digest | ClickClickJob.com</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #1f2937;">
        <!-- Email Container -->
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header -->
          <div style="background-color: #ffffff; padding: 32px 24px; border-bottom: 1px solid #e5e7eb;">
            <div style="text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #2563eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                ClickClick<span style="color: #f97316;">Job.com</span>
              </h1>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">Weekly Remote Job Digest</p>
            </div>
          </div>
          
          <!-- Hero Section -->
          <div style="background: linear-gradient(to bottom, #eff6ff, #ffffff); padding: 40px 24px; text-align: center; border-bottom: 1px solid #dbeafe;">
            <h2 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">New Remote Jobs This Week</h2>
            <p style="margin: 0; font-size: 18px; color: #4b5563; max-width: 400px; margin-left: auto; margin-right: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
              Fresh remote opportunities for admin professionals and data entry specialists
            </p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px 24px;">
            <p style="margin: 0 0 32px 0; font-size: 16px; color: #4b5563; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
              Hi there! 👋<br><br>
              Here are <strong>${jobs.length} new remote job opportunities</strong> we've found for you this week. All positions are verified and legitimate.
            </p>
            
            <!-- Job Listings -->
            ${jobsHtml}
            
            <!-- CTA Section -->
            <div style="margin-top: 40px; padding: 32px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 12px; text-align: center;">
              <h3 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">Want More Job Opportunities?</h3>
              <p style="margin: 0 0 24px 0; color: #dbeafe; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">Browse hundreds of verified remote positions on our website</p>
              <a href="https://clickclickjob.com/jobs" 
                 style="display: inline-block; padding: 16px 32px; background-color: #ffffff; color: #2563eb; font-weight: 600; border-radius: 8px; text-decoration: none; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;"
                 target="_blank">
                Browse All Jobs →
              </a>
            </div>
            
            <!-- Tips Section -->
            <div style="margin-top: 32px; padding: 24px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #2563eb;">
              <h4 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">💡 Application Tips</h4>
              <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                <li style="margin-bottom: 8px;">Apply quickly - remote jobs often receive many applications</li>
                <li style="margin-bottom: 8px;">Customize your resume for each position</li>
                <li style="margin-bottom: 8px;">Highlight your remote work experience and skills</li>
                <li>Be wary of scams - legitimate employers won't ask for money upfront</li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 32px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <div style="margin-bottom: 24px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">Stay Connected</p>
              <div style="display: inline-flex; gap: 16px;">
                <a href="https://clickclickjob.com" style="color: #2563eb; text-decoration: none; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">Website</a>
                <a href="https://clickclickjob.com/categories" style="color: #2563eb; text-decoration: none; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">Categories</a>
                <a href="https://clickclickjob.com/about" style="color: #2563eb; text-decoration: none; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">About</a>
              </div>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                You're receiving this email because you subscribed to our weekly remote job digest.<br>
                All jobs are verified for legitimacy, but always use caution when applying.
              </p>
              
              <div style="margin-top: 16px;">
                <a href="[UNSUBSCRIBE_LINK]" style="color: #6b7280; text-decoration: underline; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">Unsubscribe</a>
                <span style="color: #d1d5db; margin: 0 8px;">|</span>
                <a href="https://clickclickjob.com/privacy-policy" style="color: #6b7280; text-decoration: underline; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">Privacy Policy</a>
              </div>
              
              <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                © ${new Date().getFullYear()} ClickClickJob.com • All rights reserved
              </p>
            </div>
          </div>
          
        </div>
      </body>
    </html>
  `;
} 