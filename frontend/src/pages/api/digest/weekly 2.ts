import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';
import type { Job } from '../../../types/job';
import { sendDigest } from '../../../utils/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Security: Check for CRON secret to prevent unauthorized access
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    return res.status(500).json({ error: 'CRON_SECRET not configured' });
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Weekly digest triggered at:', new Date().toISOString());
    
    // Check environment variables
    const MONGODB_URI = process.env.MONGODB_URI;
    const MONGODB_DB = process.env.MONGODB_DB;
    
    if (!MONGODB_URI || !MONGODB_DB) {
      return res.status(500).json({ error: 'Database configuration missing' });
    }

    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(MONGODB_DB);
    const jobsCollection = db.collection<Job>('jobs');

    // Get recent jobs (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    console.log('Fetching jobs from the last 7 days...');
    const recentJobs = await jobsCollection.find({
      postedAt: { $gte: oneWeekAgo },
      title: { $exists: true, $ne: '' },
      company: { $exists: true, $ne: '' },
      url: { $exists: true, $ne: '' },
      description: { $exists: true, $ne: '' }
    })
    .sort({ postedAt: -1 })
    .limit(10) // Send up to 10 jobs
    .toArray();

    console.log(`Found ${recentJobs.length} jobs from the last 7 days`);

    // If no recent jobs, get some older jobs to send something
    let jobsToSend = recentJobs;
    if (jobsToSend.length === 0) {
      console.log('No recent jobs, fetching latest available jobs...');
      jobsToSend = await jobsCollection.find({
        title: { $exists: true, $ne: '' },
        company: { $exists: true, $ne: '' },
        url: { $exists: true, $ne: '' },
        description: { $exists: true, $ne: '' }
      })
      .sort({ postedAt: -1 })
      .limit(5)
      .toArray();
    }

    await client.close();

    if (jobsToSend.length === 0) {
      console.log('No jobs found to send');
      return res.status(200).json({ 
        message: 'No jobs available to send',
        jobsSent: 0 
      });
    }

    // Send the digest using our mailer utility
    console.log(`Sending digest with ${jobsToSend.length} jobs...`);
    await sendDigest(jobsToSend);

    console.log('Weekly digest sent successfully!');
    return res.status(200).json({ 
      message: `Weekly digest sent successfully with ${jobsToSend.length} jobs`,
      jobsSent: jobsToSend.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending weekly digest:', error);
    return res.status(500).json({ 
      error: 'Failed to send weekly digest',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 