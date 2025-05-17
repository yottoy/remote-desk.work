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
    const jobsCollection = db.collection('jobs');

    let job;
    
    // Try to find by ObjectId first
    if (ObjectId.isValid(id)) {
      job = await jobsCollection.findOne({ _id: new ObjectId(id) });
    }

    // If not found by ObjectId, try to find by slug or other fields
    if (!job) {
      job = await jobsCollection.findOne({
        $or: [
          { slug: id },
          { jobId: id }
        ]
      });
    }

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Set cache headers
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    
    return res.status(200).json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch job', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 