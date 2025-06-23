import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../utils/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid job ID' });
  }

  try {
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Failed to connect to database');
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const jobsCollection = db.collection('jobs');
    console.log(`Looking up job with ID: ${id}`);

    let job;
    
    // Try to find by ObjectId first if it's a valid ObjectId
    if (ObjectId.isValid(id)) {
      console.log(`Searching by ObjectId: ${id}`);
      job = await jobsCollection.findOne({ _id: new ObjectId(id) });
    }

    // If not found by ObjectId, try other fields with a single query
    if (!job) {
      console.log(`Searching by alternative fields for: ${id}`);
      job = await jobsCollection.findOne({
        $or: [
          { slug: id },
          { jobId: id },
          { uniqueIdentifier: id },
          { url: { $regex: id.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), $options: 'i' } }
        ]
      });
    }

    if (!job) {
      console.log(`Job not found for ID: ${id}`);
      return res.status(404).json({ error: 'Job not found' });
    }

    console.log(`Found job: ${job.title} (${job._id})`);
    
    // Set cache headers that allow revalidation
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    
    return res.status(200).json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 