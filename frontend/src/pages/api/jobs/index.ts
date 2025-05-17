import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../utils/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
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
      q = '',
      jobType = '',
      experienceLevel = '',
      payRange = '',
      location = '',
      datePosted = '',
      sort = 'newest'
    } = req.query;

    try {
      // Parse pagination parameters
      const pageNum = Math.max(1, parseInt(page as string));
      let limitNum = parseInt(limit as string);
      
      // Build filter object
      let filter: any = { isRemote: true };
      
      console.log('Query params received:', req.query);
      
      // Use either search or q parameter for searching
      const searchQuery = search || q;
      
      // Add text search if specified
      if (searchQuery && typeof searchQuery === 'string') {
        filter.$or = [
          { title: { $regex: searchQuery, $options: 'i' } },
          { company: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ];
      }
      
      // Process category filter
      if (category && typeof category === 'string') {
        const categories = category.split(',');
        if (categories.length === 1) {
          filter.jobCategory = category;
        } else if (categories.length > 1) {
          filter.jobCategory = { $in: categories };
        }
      }

      // Process job type filter
      if (jobType && typeof jobType === 'string') {
        const jobTypes = jobType.split(',');
        if (jobTypes.length === 1) {
          filter.jobType = jobType;
        } else if (jobTypes.length > 1) {
          filter.jobType = { $in: jobTypes };
        }
      }

      // Process experience level filter
      if (experienceLevel && typeof experienceLevel === 'string') {
        const expLevels = experienceLevel.split(',');
        if (expLevels.length === 1) {
          filter.experienceLevel = experienceLevel;
        } else if (expLevels.length > 1) {
          filter.experienceLevel = { $in: expLevels };
        }
      }
      
      // Process pay range filter
      if (payRange && typeof payRange === 'string') {
        const ranges = payRange.split(',');
        if (ranges.length > 0) {
          // Handle different pay range values
          const payRangeFilter: any[] = [];
          
          ranges.forEach(range => {
            if (range === 'under-$15') {
              payRangeFilter.push({ salary: /under \$15|^\$\d{1,2}\/hr|\$\d{1,2}-\d{1,2}\/hr/ });
            } else if (range === '$15-20') {
              payRangeFilter.push({ salary: /\$15|\$16|\$17|\$18|\$19|\$20|\$15-20\/hr|\$15-\$20/ });
            } else if (range === '$20-25') {
              payRangeFilter.push({ salary: /\$2[0-5]|\$20-25\/hr|\$20-\$25/ });
            } else if (range === '$25+') {
              payRangeFilter.push({ salary: /\$2[5-9]|\$[3-9]\d|\$\d{3,}|\$25\+\/hr|\$25\+/ });
            }
          });
          
          if (payRangeFilter.length > 0) {
            filter.$or = filter.$or || [];
            filter.$or = [...filter.$or, ...payRangeFilter];
          }
        }
      }
      
      // Process location filter
      if (location && typeof location === 'string') {
        const locations = location.split(',');
        if (locations.length > 0) {
          const locationFilter: any[] = [];
          
          locations.forEach(loc => {
            if (loc === 'worldwide') {
              locationFilter.push({ location: /worldwide|global|international|remote/i });
            } else if (loc === 'us-only') {
              locationFilter.push({ location: /united states|usa|us only|america/i });
            } else if (loc === 'us-canada') {
              locationFilter.push({ location: /us|united states|canada|north america/i });
            } else if (loc === 'europe') {
              locationFilter.push({ location: /europe|eu|european/i });
            }
          });
          
          if (locationFilter.length > 0) {
            filter.$or = filter.$or || [];
            filter.$or = [...filter.$or, ...locationFilter];
          }
        }
      }
      
      // Process date posted filter
      if (datePosted && typeof datePosted === 'string') {
        const dates = datePosted.split(',');
        if (dates.length > 0) {
          // Create a date filter
          if (dates.includes('today')) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filter.postedDate = { $gte: today };
          } else if (dates.includes('this-week')) {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            filter.postedDate = { $gte: weekAgo };
          } else if (dates.includes('this-month')) {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            filter.postedDate = { $gte: monthAgo };
          }
        }
      }
      
      // Print the filter for debugging
      console.log('API Query Filter:', JSON.stringify(filter));
      
      // Cap limit to reasonable number
      limitNum = Math.min(100, Math.max(1, limitNum));
      const skip = (pageNum - 1) * limitNum;

      // Determine sort order
      let sortQuery: any = { postedDate: -1 }; // Default to newest first
      
      // If sorting by relevance or prioritizing verified/high quality
      if (sort === 'relevance' && searchQuery) {
        // If sorting by relevance and there's a search query
        // Using any type here to allow MongoDB's text score sorting
        sortQuery = { score: { $meta: "textScore" }, postedDate: -1 };
      } else {
        // Priority sorting: Verified/high quality first, then by date
        sortQuery = { 
          verified: -1,
          qualityScore: -1, 
          postedDate: -1 
        };
      }

      // Execute query with pagination
      const jobs = await jobsCollection
        .find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .toArray();

      // Get total count for pagination
      const totalJobs = await jobsCollection.countDocuments(filter);

      // Add debug information in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Found ${jobs.length} jobs matching filter, total: ${totalJobs}`);
      }

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