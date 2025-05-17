import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../utils/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Failed to connect to database');
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const jobsCollection = db.collection('jobs');

    // Extract query parameters with defaults
    const {
      page = '1',
      limit = '50',  // Increased limit for better initial load
      category = '',
      search = '',
      jobType = '',
      experienceLevel = ''
    } = req.query;

    try {
      // Parse pagination parameters
      const pageNum = Math.max(1, parseInt(page as string));
      let limitNum = parseInt(limit as string);
      
      // Build lightweight filter object
      let filter: any = {};
      
      // Simplified category filtering
      if (category && typeof category === 'string') {
        filter.jobCategory = category;
      }

      // Add job type filter if specified
      if (jobType && typeof jobType === 'string') {
        filter.jobType = jobType;
      }

      // Add experience level filter if specified
      if (experienceLevel && typeof experienceLevel === 'string') {
        filter.experienceLevel = experienceLevel;
      }

      // Add text search if specified
      if (search && typeof search === 'string') {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Cap limit to reasonable number
      limitNum = Math.min(100, Math.max(1, limitNum));
      const skip = (pageNum - 1) * limitNum;

      // Execute query with pagination
      const jobs = await jobsCollection
        .find(filter)
        .sort({ postedDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();

      // Get total count for pagination
      const totalJobs = await jobsCollection.countDocuments(filter);

      // Enhanced caching for better performance
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
      
      // Return jobs with pagination metadata
      return res.status(200).json({
        jobs,
        pagination: {
          totalJobs,
          totalPages: Math.ceil(totalJobs / limitNum),
          currentPage: pageNum,
          limit: limitNum
        }
      });
    } catch (error) {
      console.error('Error processing query parameters:', error);
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
} 