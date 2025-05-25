import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import type { Job } from '../../../types/job';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Simple email test endpoint called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const MONGODB_URI = process.env.MONGODB_URI;
    const MONGODB_DB = process.env.MONGODB_DB;
    
    console.log('Environment check:', {
      hasMongoUri: !!MONGODB_URI,
      hasMongoDb: !!MONGODB_DB,
      hasMailerLiteKey: !!process.env.MAILERLITE_API_KEY,
      hasMailerLiteGroup: !!process.env.MAILERLITE_GROUP_ID
    });

    if (!MONGODB_URI || !MONGODB_DB) {
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('Connected to MongoDB successfully');
    const db = client.db(MONGODB_DB);
    const jobsCollection = db.collection<Job>('jobs');

    // Get recent jobs (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    console.log('Fetching recent jobs...');
    const recentJobs = await jobsCollection.find({
      postedAt: { $gte: oneWeekAgo },
      title: { $exists: true, $ne: '' },
      company: { $exists: true, $ne: '' },
      url: { $exists: true, $ne: '' },
      description: { $exists: true, $ne: '' }
    })
    .sort({ postedAt: -1 })
    .limit(5)
    .toArray();

    console.log(`Found ${recentJobs.length} recent jobs`);

    // Also check total jobs in database for debugging
    const totalJobs = await jobsCollection.countDocuments();
    const jobsWithAllFields = await jobsCollection.countDocuments({
      title: { $exists: true, $ne: '' },
      company: { $exists: true, $ne: '' },
      url: { $exists: true, $ne: '' },
      description: { $exists: true, $ne: '' }
    });
    
    console.log(`Database stats: ${totalJobs} total jobs, ${jobsWithAllFields} with all required fields`);

    // If no recent jobs, get any jobs for testing
    let jobsToSend = recentJobs;
    if (jobsToSend.length === 0 && jobsWithAllFields > 0) {
      console.log('No recent jobs found, getting any jobs for testing...');
      jobsToSend = await jobsCollection.find({
        title: { $exists: true, $ne: '' },
        company: { $exists: true, $ne: '' },
        url: { $exists: true, $ne: '' },
        description: { $exists: true, $ne: '' }
      })
      .sort({ postedAt: -1 })
      .limit(3)
      .toArray();
    }

    // Close MongoDB connection
    await client.close();
    console.log('MongoDB connection closed');

    // Check if MailerLite is configured
    const hasMailerLite = process.env.MAILERLITE_API_KEY && process.env.MAILERLITE_GROUP_ID;
    
    if (hasMailerLite) {
      console.log('Testing with verified sender email hi@clickclickjob.com...');
      
      if (jobsToSend.length > 0) {
        try {
          console.log('Testing MailerLite API with verified sender...');
          const response = await fetch('https://connect.mailerlite.com/api/campaigns', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              name: `Test Weekly Digest - ${new Date().toLocaleDateString()}`,
              type: 'regular',
              emails: [{
                subject: 'Test: New Remote Jobs This Week',
                from_name: 'ClickClickJob',
                from: 'hi@clickclickjob.com',
                content: `
                  <html lang="en">
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <title>Test Weekly Job Digest | ClickClickJob.com</title>
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
                            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">Test Weekly Remote Job Digest</p>
                          </div>
                        </div>
                        
                        <!-- Hero Section -->
                        <div style="background: linear-gradient(to bottom, #eff6ff, #ffffff); padding: 40px 24px; text-align: center; border-bottom: 1px solid #dbeafe;">
                          <h2 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">📧 Email System Test</h2>
                          <p style="margin: 0; font-size: 18px; color: #4b5563; max-width: 400px; margin-left: auto; margin-right: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                            Testing our weekly digest with ${jobsToSend.length} real jobs from the database
                          </p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 32px 24px;">
                          <div style="margin-bottom: 32px; padding: 24px; background-color: #dcfce7; border: 1px solid #bbf7d0; border-radius: 12px; border-left: 4px solid #22c55e;">
                            <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #166534; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">✅ Email System Working!</h3>
                            <p style="margin: 0; color: #15803d; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                              Sender email verified • MailerLite connected • Database connected • ${jobsToSend.length} jobs found
                            </p>
                          </div>
                          
                          <p style="margin: 0 0 32px 0; font-size: 16px; color: #4b5563; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                            🎉 <strong>Great news!</strong> The email digest system is fully operational.<br><br>
                            Here are the <strong>${jobsToSend.length} jobs</strong> we found in the database for testing:
                          </p>
                          
                          <!-- Job Listings -->
                          ${jobsToSend.map(job => `
                            <div style="margin-bottom: 24px; padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);">
                              <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; line-height: 1.4; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                                ${job.title}
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
                              <p style="margin: 0 0 20px 0; color: #4b5563; line-height: 1.6; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">${job.description ? job.description.substring(0, 200) + '...' : 'No description available'}</p>
                              <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="display: inline-flex; align-items: center; padding: 4px 12px; background-color: #fef3c7; color: #92400e; border-radius: 20px; font-size: 12px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                                  🧪 Test Job
                                </span>
                                <span style="padding: 12px 24px; background-color: #f3f4f6; color: #6b7280; font-weight: 600; border-radius: 8px; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                                  Database Entry
                                </span>
                              </div>
                            </div>
                          `).join('')}
                          
                          <!-- Next Steps Section -->
                          <div style="margin-top: 40px; padding: 32px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 12px; text-align: center;">
                            <h3 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">🚀 Ready for Production!</h3>
                            <p style="margin: 0 0 24px 0; color: #dbeafe; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">The weekly digest system is fully configured and ready to send real campaigns</p>
                            <div style="display: inline-flex; gap: 16px; flex-wrap: wrap; justify-content: center;">
                              <span style="padding: 12px 20px; background-color: rgba(255,255,255,0.1); color: #ffffff; border-radius: 8px; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">✅ Sender Verified</span>
                              <span style="padding: 12px 20px; background-color: rgba(255,255,255,0.1); color: #ffffff; border-radius: 8px; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">✅ API Connected</span>
                              <span style="padding: 12px 20px; background-color: rgba(255,255,255,0.1); color: #ffffff; border-radius: 8px; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">✅ ${jobsToSend.length} Jobs Found</span>
                            </div>
                          </div>
                          
                          <!-- Technical Details -->
                          <div style="margin-top: 32px; padding: 24px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #2563eb;">
                            <h4 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #1f2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">🔧 Technical Details</h4>
                            <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                              <li style="margin-bottom: 8px;">Campaign created via MailerLite API v3</li>
                              <li style="margin-bottom: 8px;">Jobs fetched from MongoDB database</li>
                              <li style="margin-bottom: 8px;">Email styling matches website design</li>
                              <li>Ready for weekly automated sending</li>
                            </ul>
                          </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #f9fafb; padding: 32px 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                          <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                            This is a test email from the ClickClickJob.com weekly digest system.
                          </p>
                          <p style="margin: 0; font-size: 12px; color: #9ca3af; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
                            © ${new Date().getFullYear()} ClickClickJob.com • Test Campaign
                          </p>
                        </div>
                        
                      </div>
                    </body>
                  </html>
                `
              }],
              groups: [process.env.MAILERLITE_GROUP_ID]
            })
          });

          const result = await response.text();
          console.log('MailerLite Campaign Creation Response:', response.status, result);

          if (response.ok) {
            return res.status(200).json({ 
              message: `✅ SUCCESS! Test campaign created with ${jobsToSend.length} jobs`,
              status: response.status,
              response: JSON.parse(result),
              jobs: jobsToSend.length,
              nextStep: 'Campaign created as draft. You can send it from MailerLite dashboard or we can add auto-send functionality.'
            });
          } else {
            return res.status(200).json({ 
              message: '❌ Campaign creation failed',
              status: response.status,
              error: result,
              jobs: jobsToSend.length
            });
          }
        } catch (emailError) {
          console.error('Email test failed:', emailError);
          return res.status(200).json({ 
            message: `Found ${jobsToSend.length} jobs, but email test failed`,
            jobs: jobsToSend.length,
            error: emailError instanceof Error ? emailError.message : JSON.stringify(emailError)
          });
        }
      } else {
        return res.status(200).json({ 
          message: 'MailerLite ready with verified sender, but no jobs to send',
          jobs: 0,
          sender: 'hi@clickclickjob.com'
        });
      }
    } else {
      console.log('MailerLite not configured');
      return res.status(200).json({ 
        message: `Found ${jobsToSend.length} jobs (MailerLite not configured)`,
        jobs: jobsToSend.length 
      });
    }

  } catch (error) {
    console.error('Error in test email:', error);
    return res.status(500).json({ 
      error: 'Failed to process test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 