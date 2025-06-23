import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import type { Job } from '../../../types/job';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Test digest endpoint called');
  
  // Check environment variables within the handler
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB;
  const CRON_SECRET = process.env.CRON_SECRET;
  
  // Log environment variables for debugging (without revealing sensitive values)
  console.log('Environment variables:', {
    hasMongoUri: !!MONGODB_URI,
    hasMongoDb: !!MONGODB_DB,
    hasCronSecret: !!CRON_SECRET,
    hasMailerLiteKey: !!process.env.MAILERLITE_API_KEY,
    hasMailerLiteGroup: !!process.env.MAILERLITE_GROUP_ID,
    cronSecret: CRON_SECRET
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for required environment variables
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined');
    return res.status(500).json({ error: 'Database configuration missing' });
  }

  if (!MONGODB_DB) {
    console.error('MONGODB_DB is not defined');
    return res.status(500).json({ error: 'Database configuration missing' });
  }

  if (!CRON_SECRET) {
    console.error('CRON_SECRET is not defined');
    return res.status(500).json({ error: 'Authentication configuration missing' });
  }

  // Check authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid authorization header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Received token:', token);
  console.log('Expected token:', CRON_SECRET);
  console.log('Token comparison result:', token === CRON_SECRET);
  console.log('Token length:', token.length, 'Expected length:', CRON_SECRET.length);
  
  if (token !== CRON_SECRET) {
    console.log('Invalid token provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI as string);
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
    .limit(10)
    .toArray();

    console.log(`Found ${recentJobs.length} recent jobs`);

    // Close MongoDB connection
    await client.close();
    console.log('MongoDB connection closed');

    // Check if MailerLite is configured
    const hasMailerLite = process.env.MAILERLITE_API_KEY && process.env.MAILERLITE_GROUP_ID;
    
    if (hasMailerLite) {
      // Try to send digest using the mailer utility
      console.log('MailerLite configured, attempting to send weekly digest...');
      try {
        const { sendDigest } = await import('../../../utils/mailer');
        await sendDigest(recentJobs);
        console.log('Weekly digest sent successfully');
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        return res.status(200).json({ 
          message: `Found ${recentJobs.length} recent jobs, but email sending failed`,
          jobs: recentJobs.length,
          error: 'Email sending failed - this might be due to MailerLite account verification'
        });
      }
    } else {
      console.log('MailerLite not configured, skipping email sending');
    }

    return res.status(200).json({ 
      message: hasMailerLite ? 'Weekly digest sent successfully' : `Found ${recentJobs.length} recent jobs (email sending skipped - MailerLite not configured)`,
      jobs: recentJobs.length 
    });
  } catch (error) {
    console.error('Error in test digest:', error);
    return res.status(500).json({ 
      error: 'Failed to process digest',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 