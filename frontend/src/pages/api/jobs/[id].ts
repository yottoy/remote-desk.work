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
    
    // Try to find by ObjectId first if it's a valid ObjectId
    if (ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id)) {
      job = await jobsCollection.findOne({ _id: new ObjectId(id) });
    }

    // If not found by ObjectId, try other fields with a single query
    if (!job) {
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
      return res.status(404).json({ error: 'Job not found' });
    }

    // Set enhanced cache headers for better performance
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400');
    
    return res.status(200).json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch job'
    });
  }
} 