import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../utils/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Jobs API route called with query:', req.query);

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Extract query parameters with defaults
    const {
      page = '1',
      limit = '20'
    } = req.query;

    try {
      // Simplified query - just get all jobs without any filters
      const filter = {};
      console.log('Using simplified query filter:', filter);

      // Pagination
      let pageNum = Math.max(1, parseInt(page as string));
      let limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
      const skip = (pageNum - 1) * limitNum;

      // First check total count
      const totalJobs = await jobsCollection.countDocuments(filter);
      console.log('Total jobs in collection:', totalJobs);

      // Execute query with pagination
      const jobs = await jobsCollection
        .find(filter)
        .skip(skip)
        .limit(limitNum)
        .toArray();

      console.log(`Found ${jobs.length} jobs for current page`);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalJobs / limitNum);

      // Return jobs with pagination metadata
      return res.status(200).json({
        jobs,
        pagination: {
          totalJobs,
          totalPages,
          currentPage: pageNum,
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('Error processing query:', error);
      return res.status(400).json({ 
        error: 'Query processing error', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch jobs', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 