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
  
  // Log the incoming request URL for debugging
  console.log('API Jobs Request URL:', req.url);

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
      
      // Build filter object - start with an AND condition list
      const filterConditions = [];
      
      // Always filter for remote jobs
      filterConditions.push({ isRemote: true });
      
      console.log('Query params received:', req.query);
      
      // Use either search or q parameter for searching
      const searchQuery = search || q;
      
      // Add text search if specified
      if (searchQuery && typeof searchQuery === 'string') {
        filterConditions.push({
          $or: [
            { title: { $regex: searchQuery, $options: 'i' } },
            { company: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } }
          ]
        });
      }
      
      // Process category filter
      if (category && typeof category === 'string') {
        const categories = category.split(',');
        if (categories.length === 1) {
          // Single category - look for exact match or pattern match
          filterConditions.push({ jobCategory: { $regex: category, $options: 'i' } });
        } else if (categories.length > 1) {
          // Multiple categories - use $or to match any of them
          const categoryFilters = categories.map(cat => ({ 
            jobCategory: { $regex: cat, $options: 'i' } 
          }));
          
          filterConditions.push({ $or: categoryFilters });
        }
      }

      // Process job type filter
      if (jobType && typeof jobType === 'string') {
        const jobTypes = jobType.split(',');
        if (jobTypes.length === 1) {
          filterConditions.push({ jobType: jobType });
        } else if (jobTypes.length > 1) {
          filterConditions.push({ jobType: { $in: jobTypes } });
        }
      }

      // Process experience level filter
      if (experienceLevel && typeof experienceLevel === 'string') {
        const expLevels = experienceLevel.split(',');
        if (expLevels.length === 1) {
          filterConditions.push({ experienceLevel: experienceLevel });
        } else if (expLevels.length > 1) {
          filterConditions.push({ experienceLevel: { $in: expLevels } });
        }
      }
      
      // Process pay range filter
      if (payRange && typeof payRange === 'string') {
        const ranges = payRange.split(',');
        if (ranges.length > 0) {
          // Handle different pay range values
          const payRangeFilters: Array<{ salary: { $regex: string, $options: string } }> = [];
          
          ranges.forEach(range => {
            if (range === 'under-$15') {
              payRangeFilters.push({ 
                salary: { $regex: "(under.*\\$15|^\\$\\d{1,2}\\/hr|\\$\\d{1,2}-\\d{1,2}\\/hr)", $options: "i" } 
              });
            } else if (range === '$15-20') {
              payRangeFilters.push({ 
                salary: { $regex: "(\\$15|\\$16|\\$17|\\$18|\\$19|\\$20|\\$15.*\\$20)", $options: "i" } 
              });
            } else if (range === '$20-25') {
              payRangeFilters.push({ 
                salary: { $regex: "(\\$2[0-5]|\\$20.*\\$25)", $options: "i" } 
              });
            } else if (range === '$25+') {
              payRangeFilters.push({ 
                salary: { $regex: "(\\$2[5-9]|\\$[3-9]\\d|\\$\\d{3,}|\\$25\\+)", $options: "i" } 
              });
            }
          });
          
          if (payRangeFilters.length > 0) {
            filterConditions.push({ $or: payRangeFilters });
          }
        }
      }
      
      // Process location filter
      if (location && typeof location === 'string') {
        const locations = location.split(',');
        if (locations.length > 0) {
          const locationFilters: Array<{ location: { $regex: string, $options: string } }> = [];
          
          locations.forEach(loc => {
            if (loc === 'worldwide') {
              locationFilters.push({ 
                location: { $regex: "(worldwide|global|international|remote)", $options: "i" } 
              });
            } else if (loc === 'us-only') {
              locationFilters.push({ 
                location: { $regex: "(united.*states|usa|us.*only|america)", $options: "i" } 
              });
            } else if (loc === 'us-canada') {
              locationFilters.push({ 
                location: { $regex: "(us|united.*states|canada|north.*america)", $options: "i" } 
              });
            } else if (loc === 'europe') {
              locationFilters.push({ 
                location: { $regex: "(europe|eu|european)", $options: "i" } 
              });
            }
          });
          
          if (locationFilters.length > 0) {
            filterConditions.push({ $or: locationFilters });
          }
        }
      }
      
      // Process date posted filter
      if (datePosted && typeof datePosted === 'string') {
        const dates = datePosted.split(',');
        if (dates.length > 0) {
          if (dates.includes('today')) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filterConditions.push({ postedDate: { $gte: today } });
          } else if (dates.includes('this-week')) {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            filterConditions.push({ postedDate: { $gte: weekAgo } });
          } else if (dates.includes('this-month')) {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            filterConditions.push({ postedDate: { $gte: monthAgo } });
          }
        }
      }
      
      // Build the final filter object using $and to combine all conditions
      let filter: any = {};
      if (filterConditions.length > 0) {
        filter.$and = filterConditions;
      } else {
        filter = { isRemote: true };
      }
      
      // Print the filter for debugging
      console.log('API Query Filter:', JSON.stringify(filter, null, 2));
      
      // Log all the active conditions
      console.log('Active Filter Conditions:', filterConditions.length);
      
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