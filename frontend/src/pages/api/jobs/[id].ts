import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../../utils/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Job details API route called with query:', req.query);

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the job ID from the URL
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    console.error('Invalid job ID provided:', id);
    return res.status(400).json({ error: 'Job ID is required' });
  }

  try {
    console.log('Attempting to connect to database...');
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Failed to connect to database');
      return res.status(500).json({ error: 'Database connection failed' });
    }
    console.log('Successfully connected to database');
    
    const jobsCollection = db.collection('jobs');

    // Try to find the job by its ID
    let objectId;
    let job;
    
    try {
      objectId = new ObjectId(id);
      console.log('Looking up job with ObjectId:', objectId);
      job = await jobsCollection.findOne({ _id: objectId });
    } catch (error) {
      console.error('Error with ObjectId, trying string ID lookup:', error);
      // If ObjectId fails, try looking up by string ID
      job = await jobsCollection.findOne({ 
        $or: [
          { _id: id },
          { uniqueIdentifier: id }
        ]
      });
    }

    if (!job) {
      console.error('Job not found for ID:', id);
      return res.status(404).json({ error: 'Job not found' });
    }

    console.log('Successfully found job:', job._id);

    // Return the job
    return res.status(200).json(job);
  } catch (error) {
    console.error('Error fetching job details:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch job details',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 