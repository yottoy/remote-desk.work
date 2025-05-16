import type { NextApiRequest, NextApiResponse } from 'next';
import { mockJobs } from '../../../mocks/jobData';
import { Job } from '../../../types/job';

interface JobsApiResponse {
  jobs: Job[];
  pagination: {
    totalJobs: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

/**
 * API endpoint for fetching job listings with optional filters
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<JobsApiResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    // Parse query parameters
    const {
      q: searchQuery = '',
      page = '1',
      limit = '10',
      jobCategory,
      jobType,
      experienceLevel,
      payRange,
      location,
      datePosted,
      softwareRequirements,
      // Add any other filters here
    } = req.query;
    
    // Convert parameters to appropriate types
    const currentPage = parseInt(page as string, 10) || 1;
    const pageLimit = parseInt(limit as string, 10) || 10;
    
    // Start with all jobs (in a real app, this would be a database query)
    let filteredJobs = [...mockJobs];
    
    // Apply search if present
    if (searchQuery && typeof searchQuery === 'string') {
      const query = searchQuery.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(query) || 
        job.company.toLowerCase().includes(query) || 
        job.descriptionText?.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (jobCategory && typeof jobCategory === 'string') {
      const categories = jobCategory.split(',');
      filteredJobs = filteredJobs.filter(job => 
        job.jobCategory && categories.includes(job.jobCategory)
      );
    }
    
    // Apply job type filter
    if (jobType && typeof jobType === 'string') {
      const types = jobType.split(',');
      filteredJobs = filteredJobs.filter(job => 
        job.jobType && types.includes(job.jobType)
      );
    }
    
    // Apply experience level filter
    if (experienceLevel && typeof experienceLevel === 'string') {
      const levels = experienceLevel.split(',');
      filteredJobs = filteredJobs.filter(job => 
        job.experienceLevel && levels.includes(job.experienceLevel)
      );
    }
    
    // Apply pay range filter
    if (payRange && typeof payRange === 'string') {
      const ranges = payRange.split(',');
      filteredJobs = filteredJobs.filter(job => 
        job.payRange && ranges.includes(job.payRange)
      );
    }
    
    // Apply location filter
    if (location && typeof location === 'string') {
      const locations = location.split(',');
      filteredJobs = filteredJobs.filter(job => 
        job.location_restriction && locations.includes(job.location_restriction)
      );
    }
    
    // Apply date posted filter
    if (datePosted && typeof datePosted === 'string') {
      const dates = datePosted.split(',');
      filteredJobs = filteredJobs.filter(job => 
        job.datePosted && dates.includes(job.datePosted)
      );
    }
    
    // Apply software requirements filter
    if (softwareRequirements && typeof softwareRequirements === 'string') {
      const requirements = softwareRequirements.split(',');
      filteredJobs = filteredJobs.filter(job => {
        if (!job.softwareRequirements) return false;
        return requirements.some(req => job.softwareRequirements?.includes(req));
      });
    }
    
    // Calculate pagination
    const totalJobs = filteredJobs.length;
    const totalPages = Math.ceil(totalJobs / pageLimit);
    
    // Apply pagination
    const startIndex = (currentPage - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);
    
    // Return paginated results
    res.status(200).json({
      jobs: paginatedJobs,
      pagination: {
        totalJobs,
        totalPages,
        currentPage,
        limit: pageLimit
      }
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      jobs: [],
      pagination: {
        totalJobs: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10
      }
    });
  }
} 