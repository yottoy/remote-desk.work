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
      limit = '20',
      category = '',
      search = '',
      jobType = '',
      experienceLevel = '',
      remote = 'true'
    } = req.query;

    try {
      // Parse pagination parameters
      const pageNum = Math.max(1, parseInt(page as string));
      let limitNum = parseInt(limit as string);
      
      // Build filter object
      const filter: any = {
        $or: [
          { remote: true },
          { location: { $regex: 'Remote', $options: 'i' } }
        ]
      };

      // Add category filter if specified
      if (category) {
        filter.jobCategory = category;
      }

      // Add job type filter if specified
      if (jobType) {
        filter.jobType = jobType;
      }

      // Add experience level filter if specified
      if (experienceLevel) {
        filter.experienceLevel = experienceLevel;
      }

      // Add text search if specified
      if (search) {
        filter.$and = [
          filter,
          {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { company: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ]
          }
        ];
      }

      // Ensure we're not filtering out valid jobs unintentionally
      console.log('Using filter:', JSON.stringify(filter, null, 2));
      
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

      console.log(`Found ${totalJobs} total jobs matching filter`);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalJobs / limitNum);

      // Set cache headers
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

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
      console.error('Error processing query parameters:', error);
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
} 