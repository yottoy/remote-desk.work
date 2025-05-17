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
      keyword = '',
      jobType = '',
      experienceLevel = '',
      minSalary = '',
      maxSalary = '',
      employmentType = '',
      softwareSkills = '',
      timezone = '',
      postedAfter = '',
      page = '1',
      limit = '20',
      sortBy = 'date',
      sortOrder = 'desc',
      includeHidden = 'false'  // Default to excluding hidden jobs
    } = req.query;

    try {
      // Build the query filter
      const filter: any = {};

      // Text search for keywords (across multiple fields)
      if (keyword) {
        filter.$or = [
          { title: { $regex: keyword as string, $options: 'i' } },
          { description: { $regex: keyword as string, $options: 'i' } },
          { company: { $regex: keyword as string, $options: 'i' } }
        ];
      }

      // Job type filter (data entry, virtual assistant, customer service, etc.)
      if (jobType) {
        filter.jobType = { $regex: jobType as string, $options: 'i' };
      }

      // Experience level filter
      if (experienceLevel) {
        filter.experienceLevel = { $regex: experienceLevel as string, $options: 'i' };
      }

      // Salary range filter
      if (minSalary) {
        filter.salary = filter.salary || {};
        try {
          filter.salary.$gte = parseInt(minSalary as string);
        } catch (e) {
          console.error('Invalid minSalary value:', e);
        }
      }

      if (maxSalary) {
        filter.salary = filter.salary || {};
        try {
          filter.salary.$lte = parseInt(maxSalary as string);
        } catch (e) {
          console.error('Invalid maxSalary value:', e);
        }
      }

      // Employment type filter (full-time/part-time)
      if (employmentType) {
        filter.employmentType = { $regex: employmentType as string, $options: 'i' };
      }

      // Software skills filter
      if (softwareSkills) {
        const skills = (softwareSkills as string).split(',').map(skill => skill.trim());
        filter.skills = { $in: skills };
      }

      // Timezone requirements filter
      if (timezone) {
        filter.timezone = { $regex: timezone as string, $options: 'i' };
      }

      // Posted date filter
      if (postedAfter) {
        try {
          const postedDate = new Date(postedAfter as string);
          filter.postedDate = { $gte: postedDate };
        } catch (e) {
          console.error('Invalid date format for postedAfter:', e);
          // Continue without this filter if date is invalid
        }
      }

      // Make sure we only return remote jobs
      filter.remote = true;
      
      // Filter out hidden jobs (unless explicitly requested)
      if (includeHidden !== 'true') {
        filter.hidden = { $ne: true };
      }

      // Pagination - with validation
      let pageNum = 1;
      let limitNum = 20;
      
      try {
        pageNum = Math.max(1, parseInt(page as string));
      } catch (e) {
        console.error('Invalid page number, using default:', e);
      }
      
      try {
        limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
      } catch (e) {
        console.error('Invalid limit, using default:', e);
      }
      
      const skip = (pageNum - 1) * limitNum;

      // Sorting
      const sortOptions: any = {};
      if (sortBy === 'date') {
        sortOptions.postedDate = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'salary') {
        sortOptions.salary = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'relevance') {
        sortOptions.credibilityScore = -1;
      }

      // Execute query with pagination
      const jobs = await jobsCollection
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .toArray();

      // Get total count for pagination
      const totalJobs = await jobsCollection.countDocuments(filter);

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
      console.error('Error processing query parameters:', error);
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
} 