import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, WithId, Document } from 'mongodb';
import { JobDigestService } from '../../../services/jobDigest';
import { mailerLiteConfig } from '../../../config/mailerlite';
import { format, subDays } from 'date-fns';
import { Job } from '../../../types/job';

// Type that matches JobDigestService requirements
interface DigestJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
}

// Verify the request is from Vercel Cron
function verifyCronRequest(req: NextApiRequest): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];
  return token === process.env.CRON_SECRET;
}

// Convert MongoDB document to DigestJob type
function convertToDigestJob(doc: WithId<Job>): DigestJob | null {
  const { _id, ...rest } = doc;
  // Ensure required fields exist
  if (!rest.description || !rest.url) {
    console.log(`Job ${_id} filtered out due to missing fields:`, {
      hasDescription: !!rest.description,
      hasUrl: !!rest.url,
      title: rest.title,
      company: rest.company
    });
    return null;
  }
  return {
    title: rest.title,
    company: rest.company,
    location: rest.location,
    description: rest.description,
    url: rest.url
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron request
  if (!verifyCronRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(process.env.MONGODB_URI!);
    const db = client.db(process.env.MONGODB_DB);
    const jobsCollection = db.collection<Job>('jobs');
    const digestCollection = db.collection('jobdigests');

    // Get jobs from the past 7 days
    const sevenDaysAgo = subDays(new Date(), 7);
    console.log('Fetching jobs since:', sevenDaysAgo);
    
    const recentJobs = await jobsCollection.find({
      postedDate: { $gte: sevenDaysAgo },
      // Exclude mock jobs and low quality listings
      isMock: { $ne: true },
      is_mock_data: { $ne: true },
      // Remove quality score requirement temporarily
      // qualityScore: { $gte: 6 },
      // Ensure job has required fields
      title: { $exists: true },
      company: { $exists: true },
      url: { $exists: true },
      description: { $exists: true }
          }).sort({ postedDate: -1 }).toArray();

    console.log(`Found ${recentJobs.length} recent jobs`);
    
    // Log sample of jobs to check their fields
    if (recentJobs.length > 0) {
      console.log('Sample job:', {
        id: recentJobs[0]._id,
        title: recentJobs[0].title,
        company: recentJobs[0].company,
        postedDate: recentJobs[0].postedDate,
        isMock: recentJobs[0].isMock,
        is_mock_data: recentJobs[0].is_mock_data,
        hasTitle: !!recentJobs[0].title,
        hasCompany: !!recentJobs[0].company,
        hasUrl: !!recentJobs[0].url,
        hasDescription: !!recentJobs[0].description
      });
    }

    // Get the last digest to avoid duplicates
    const lastDigest = await digestCollection.findOne(
      { status: 'sent' },
      { sort: { digestDate: -1 } }
    );

    console.log('Last digest:', lastDigest ? {
      date: lastDigest.digestDate,
      jobCount: lastDigest.jobs.length
    } : 'No previous digest found');

    // Filter out jobs that were in the last digest and ensure required fields
    const lastDigestJobIds = lastDigest?.jobs.map((j: { jobId: string }) => j.jobId) || [];
    const newJobs = recentJobs
      .filter(job => !lastDigestJobIds.includes(job._id.toString()))
      .map(convertToDigestJob)
      .filter((job): job is DigestJob => job !== null); // Type guard to remove null values

    console.log(`Found ${newJobs.length} new jobs to send`);
    if (newJobs.length === 0 && recentJobs.length > 0) {
      console.log('Jobs were filtered out. Checking why:');
      recentJobs.forEach(job => {
        const isInLastDigest = lastDigestJobIds.includes(job._id.toString());
        const hasRequiredFields = !!(job.title && job.company && job.url && job.description);
        console.log(`Job ${job._id}:`, {
          title: job.title,
          isInLastDigest,
          hasRequiredFields,
          missingFields: {
            title: !job.title,
            company: !job.company,
            url: !job.url,
            description: !job.description
          }
        });
      });
    }

    if (newJobs.length === 0) {
      console.log('No new jobs to send in digest');
      return res.status(200).json({ message: 'No new jobs to send' });
    }

    // Create digest record
    const digest = {
      digestDate: new Date(),
      jobs: recentJobs
        .filter(job => !lastDigestJobIds.includes(job._id.toString()))
        .map(job => ({
          jobId: job._id.toString(),
          title: job.title,
          company: job.company,
          url: job.url
        })),
      status: 'pending',
      recipientCount: 0
    };

    const digestResult = await digestCollection.insertOne(digest);

    // Initialize MailerLite service
    const jobDigestService = new JobDigestService();

    // Send the digest
    await jobDigestService.sendWeeklyDigest(newJobs);

    // Update digest status
    await digestCollection.updateOne(
      { _id: digestResult.insertedId },
      { 
        $set: { 
          status: 'sent',
          sentAt: new Date(),
          recipientCount: newJobs.length
        }
      }
    );

    await client.close();

    return res.status(200).json({ 
      success: true, 
      message: `Digest sent with ${newJobs.length} jobs`,
      digestId: digestResult.insertedId
    });

  } catch (error) {
    console.error('Error in weekly digest cron:', error);
    return res.status(500).json({ 
      error: 'Failed to send weekly digest',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 