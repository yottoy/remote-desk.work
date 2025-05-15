import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../../utils/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the job ID from the URL
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    const { db } = await connectToDatabase();
    const jobsCollection = db.collection('jobs');

    // Try to find the job by its ID
    let objectId;
    
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }

    const job = await jobsCollection.findOne({ _id: objectId });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Return the job
    return res.status(200).json(job);
  } catch (error) {
    console.error('Error fetching job details:', error);
    return res.status(500).json({ error: 'Failed to fetch job details' });
  }
} 