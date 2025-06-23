import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../utils/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const jobsCollection = db.collection('jobs');

    // Aggregate jobs to extract unique categories and their counts
    const categories = await jobsCollection.aggregate([
      // Only include remote jobs
      { $match: { remote: true } },
      
      // Group by job type
      { 
        $group: { 
          _id: '$jobType', 
          count: { $sum: 1 } 
        } 
      },
      
      // Sort by count, descending
      { $sort: { count: -1 } },
      
      // Rename _id to category
      { 
        $project: { 
          _id: 0, 
          category: '$_id', 
          count: 1 
        } 
      }
    ]).toArray();

    // Handle case where jobType field might not exist in some documents
    // In that case, add an "Uncategorized" entry
    const uncategorizedCount = await jobsCollection.countDocuments({ 
      remote: true,
      jobType: { $exists: false } 
    });

    if (uncategorizedCount > 0) {
      categories.push({
        category: 'Uncategorized',
        count: uncategorizedCount
      });
    }

    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching job categories:', error);
    return res.status(500).json({ error: 'Failed to fetch job categories' });
  }
} 