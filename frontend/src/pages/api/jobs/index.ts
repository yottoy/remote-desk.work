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
      softwareRequirements = '',
      jobCategory = '',  // Support for both category and jobCategory
      sort = 'newest'
    } = req.query;

    try {
      // Parse pagination parameters
      const pageNum = Math.max(1, parseInt(page as string));
      let limitNum = parseInt(limit as string);
      
      // Build filter object - MINIMAL filtering for emergency fix
      const filterConditions = [];
      
      // EMERGENCY: Only basic existence checks - no content filtering
      filterConditions.push({
        description: { $exists: true, $ne: null },
        title: { $exists: true, $ne: null }
      });
      
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
      
      // Also check jobCategory field if category wasn't provided
      const categoryFilter = category || jobCategory;
      
      if (categoryFilter && typeof categoryFilter === 'string') {
        console.log('Processing category filter:', categoryFilter);
        const categories = categoryFilter.split(',');
        
        if (categories.length === 1) {
          console.log('Single category filter:', categories[0]);
          // Single category - handle both jobCategory and title matching
          // This makes filtering more robust since some jobs might not have jobCategory set
          filterConditions.push({ 
            $or: [
              // Exact match on jobCategory field
              { jobCategory: categoryFilter },
              // Case-insensitive match on jobCategory
              { jobCategory: { $regex: `^${categoryFilter}$`, $options: 'i' } },
              // Match in title field for better coverage
              { title: { $regex: categoryFilter.replace(/-/g, ' '), $options: 'i' } }
            ] 
          });
        } else if (categories.length > 1) {
          console.log('Multiple category filters:', categories);
          // Multiple categories - broader matching for each category
          const categoryFilters = categories.map(cat => ({ 
            $or: [
              { jobCategory: cat },
              { jobCategory: { $regex: `^${cat}$`, $options: 'i' } },
              { title: { $regex: cat.replace(/-/g, ' '), $options: 'i' } }
            ]
          }));
          
          filterConditions.push({ $or: categoryFilters });
        }
      }

      // Process job type filter
      if (jobType && typeof jobType === 'string') {
        const jobTypes = jobType.split(',');
        if (jobTypes.length === 1) {
          filterConditions.push({ jobType: { $regex: jobType, $options: 'i' } });
        } else if (jobTypes.length > 1) {
          const typeFilters = jobTypes.map(type => ({ 
            jobType: { $regex: type, $options: 'i' } 
          }));
          filterConditions.push({ $or: typeFilters });
        }
      }

      // Process experience level filter
      if (experienceLevel && typeof experienceLevel === 'string') {
        const expLevels = experienceLevel.split(',');
        if (expLevels.length === 1) {
          filterConditions.push({ experienceLevel: { $regex: experienceLevel, $options: 'i' } });
        } else if (expLevels.length > 1) {
          const levelFilters = expLevels.map(level => ({ 
            experienceLevel: { $regex: level, $options: 'i' } 
          }));
          filterConditions.push({ $or: levelFilters });
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
            } else if (loc === 'asia') {
              locationFilters.push({ 
                location: { $regex: "(asia|india|china|japan|singapore|philippines|thailand|malaysia|indonesia)", $options: "i" } 
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
      
      // Process software requirements filter
      if (softwareRequirements && typeof softwareRequirements === 'string') {
        const software = softwareRequirements.split(',');
        if (software.length > 0) {
          const softwareFilters: Array<any> = [];
          
          software.forEach(sw => {
            // Transform into human-readable form for better matching
            const readableValue = sw.replace(/-/g, ' ');
            
            softwareFilters.push({ 
              $or: [
                // Match in skills array
                { skills: { $in: [sw, readableValue] } },
                // Match in description text
                { description: { $regex: readableValue, $options: 'i' } },
                // Match in descriptionText field if present
                { descriptionText: { $regex: readableValue, $options: 'i' } }
              ] 
            });
          });
          
          if (softwareFilters.length > 0) {
            filterConditions.push({ $or: softwareFilters });
          }
        }
      }
      
      // IMPORTANT: Add filters to exclude mock jobs
      filterConditions.push({
        $and: [
          // Exclude jobs with ID like "job1", "job2", etc.
          { _id: { $not: { $regex: /^job\d+$/ } } },
          // Explicitly block any TechCorp jobs
          { company: { $ne: "TechCorp Solutions" } },
          // Extra safety: block anything with TechCorp in the name
          { company: { $not: { $regex: /TechCorp/ } } },
          // Exclude jobs explicitly marked as mock
          { $or: [
              { isMock: { $ne: true } },
              { isMock: { $exists: false } }
            ]
          },
          // Exclude jobs with mock data flag
          { $or: [
              { is_mock_data: { $ne: true } },
              { is_mock_data: { $exists: false } }
            ]
          },
          // REQUIRE valid URLs - exclude jobs without proper application links
          { url: { $exists: true } },
          { url: { $ne: null } },
          { url: { $ne: '' } },
          { url: { $regex: /^https?:\/\// } },  // Must start with http:// or https://
          // Exclude jobs with example.com or invalid URLs
          { url: { $not: { $regex: /example\.com|test|mock|placeholder/i } } },
          // Exclude jobs with titles that suggest engineering roles
          { title: { $not: { $regex: /engineer|developer|software|coding|programming|devops|architect|frontend|backend|fullstack|tech lead|IT manager|sys admin|network admin|security/i } } },
          // Exclude jobs with irrelevant job categories
          { $or: [
              { jobCategory: { $not: { $regex: /engineering|development|programming|IT|security|networking/i } } },
              { jobCategory: { $exists: false } }
            ]
          }
        ]
      });
      
      // Build the final filter object using $and to combine all conditions
      let filter: any = {};
      if (filterConditions.length > 0) {
        filter.$and = filterConditions;
      } else {
        filter = { remote: true };
      }
      
      // Print the filter for debugging
      console.log('API Query Filter:', JSON.stringify(filter, null, 2));
      
      // Log all the active conditions for debugging
      console.log('Active Filter Conditions Count:', filterConditions.length);
      filterConditions.forEach((condition, index) => {
        console.log(`Filter Condition ${index}:`, JSON.stringify(condition, null, 2));
      });
      
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
      } else if (sort === 'oldest') {
        // Sort by oldest first
        sortQuery = { postedDate: 1 };
      } else {
        // Default sorting: Just by posting date (newest first)
        // Removed verified/qualityScore since they don't exist in our data
        sortQuery = { postedDate: -1 };
      }

      // Execute query with pagination
      const jobs = await jobsCollection
        .find(filter)
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .toArray();

      // Preserve original posted dates - DO NOT override with current date
      const processedJobs = jobs.map((job: { [key: string]: any }) => {
        // Debug: Log the original postedDate from database
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Job "${job.title?.substring(0, 30)}" DB postedDate:`, job.postedDate);
        }
        
        return {
          ...job,
          // Ensure postedDate is properly formatted but preserve the original date
          postedDate: job.postedDate ? 
            (job.postedDate instanceof Date ? job.postedDate.toISOString() : job.postedDate) : 
            new Date().toISOString() // Only use current date if no posting date exists
        };
      });

      // Get total count for pagination
      const totalJobs = await jobsCollection.countDocuments(filter);

      // Add debug information in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Found ${jobs.length} jobs matching filter, total: ${totalJobs}`);
      }

      // Enhanced caching for better performance but more responsive
      res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=60');
      
      // Return jobs with pagination metadata
      return res.status(200).json({
        jobs: processedJobs,
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