import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../utils/mongodb';

// Admin and data entry related keywords
const ADMIN_KEYWORDS = [
  'admin', 'administrative', 'data entry', 'virtual assistant', 
  'executive assistant', 'customer service', 'receptionist',
  'office assistant', 'secretary', 'clerical', 'clerk', 
  'bookkeeper', 'appointment setter', 'scheduler',
  'typist', 'transcriber', 'transcription'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const jobsCollection = db.collection('jobs');

    // Extract query parameters with defaults
    const {
      keyword = '',
      experienceLevel = '',
      minSalary = '',
      maxSalary = '',
      employmentType = '',
      timezone = '',
      postedAfter = '',
      page = '1',
      limit = '20',
      sortBy = 'date',
      sortOrder = 'desc',
      includeHidden = 'false'  // Default to excluding hidden jobs
    } = req.query;

    // Build the query filter
    const filter: any = {
      // Ensure we only get remote jobs
      remote: true,
      
      // Filter for admin and data entry related jobs
      $or: [
        // Match job titles containing admin keywords
        { 
          title: { 
            $regex: ADMIN_KEYWORDS.join('|'), 
            $options: 'i' 
          } 
        },
        // Match job types explicitly marked as admin-related
        { 
          jobType: { 
            $in: ['Administrative', 'Data Entry', 'Virtual Assistant', 'Customer Service'] 
          } 
        },
        // Match jobs with specific skills
        {
          skills: {
            $in: ['data entry', 'administrative', 'microsoft office', 'typing', 'clerical']
          }
        }
      ]
    };

    // Add additional keyword search if provided
    if (keyword) {
      filter.$and = [
        filter.$or, // Keep our existing admin filters
        {
          $or: [
            { title: { $regex: keyword as string, $options: 'i' } },
            { description: { $regex: keyword as string, $options: 'i' } },
            { company: { $regex: keyword as string, $options: 'i' } }
          ]
        }
      ];
      // Remove the original $or since we've incorporated it into $and
      delete filter.$or;
    }

    // Experience level filter
    if (experienceLevel) {
      filter.experienceLevel = { $regex: experienceLevel as string, $options: 'i' };
    }

    // Salary range filter
    if (minSalary) {
      filter.salary = filter.salary || {};
      filter.salary.$gte = parseInt(minSalary as string);
    }

    if (maxSalary) {
      filter.salary = filter.salary || {};
      filter.salary.$lte = parseInt(maxSalary as string);
    }

    // Employment type filter (full-time/part-time)
    if (employmentType) {
      filter.employmentType = { $regex: employmentType as string, $options: 'i' };
    }

    // Timezone requirements filter
    if (timezone) {
      filter.timezone = { $regex: timezone as string, $options: 'i' };
    }

    // Posted date filter
    if (postedAfter) {
      const postedDate = new Date(postedAfter as string);
      filter.postedDate = { $gte: postedDate };
    }
    
    // Filter out hidden jobs (unless explicitly requested)
    if (includeHidden !== 'true') {
      // We need to combine this with our existing $or/$and logic
      if (filter.$and) {
        // If we already have $and, add hidden filter to it
        filter.$and.push({ hidden: { $ne: true } });
      } else if (filter.$or) {
        // If we have just $or, convert to $and with $or and hidden filter
        filter.$and = [
          { $or: filter.$or },
          { hidden: { $ne: true } }
        ];
        delete filter.$or;
      } else {
        // Simple case - just add the hidden filter
        filter.hidden = { $ne: true };
      }
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
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
    console.error('Error fetching admin jobs:', error);
    return res.status(500).json({ error: 'Failed to fetch admin jobs' });
  }
} 