import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../utils/mongodb';

interface EventType {
  _id: string;
  count: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authorization
  const authToken = req.headers['x-admin-auth'] as string;
  const expectedToken = process.env.ADMIN_SECRET_TOKEN;

  if (!authToken || authToken !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get timeframe from query
  const { timeframe = 'week' } = req.query;
  
  // Calculate date range
  const now = new Date();
  let startDate: Date;
  
  switch (timeframe) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'week':
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
  }

  try {
    const { db } = await connectToDatabase();
    
    // Count total events
    const totalEvents = await db.collection('analytics_events').countDocuments({
      timestamp: { $gte: startDate.toISOString() }
    });
    
    // Get event type breakdown
    const eventTypes = await db.collection('analytics_events').aggregate([
      { $match: { timestamp: { $gte: startDate.toISOString() } } },
      { $group: { _id: '$event', count: { $sum: 1 } } }
    ]).toArray() as EventType[];
    
    const eventCounts = eventTypes.reduce((acc: Record<string, number>, curr: EventType) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    
    // Get top viewed jobs
    const topViewedJobs = await db.collection('analytics_events').aggregate([
      { $match: { 
        event: 'job_view',
        timestamp: { $gte: startDate.toISOString() },
        jobTitle: { $exists: true }
      }},
      { $group: { 
        _id: { jobId: '$jobId', jobTitle: '$jobTitle', company: '$company' },
        views: { $sum: 1 }
      }},
      { $sort: { views: -1 } },
      { $limit: 5 },
      { $project: {
        _id: 0,
        jobId: '$_id.jobId',
        jobTitle: '$_id.jobTitle',
        company: '$_id.company',
        views: 1
      }}
    ]).toArray();
    
    // Get top searches
    const topSearches = await db.collection('analytics_events').aggregate([
      { $match: { 
        event: 'search',
        timestamp: { $gte: startDate.toISOString() },
        searchQuery: { $exists: true, $ne: '' }
      }},
      { $group: { 
        _id: '$searchQuery',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: {
        _id: 0,
        query: '$_id',
        count: 1
      }}
    ]).toArray();
    
    // Get daily events
    const dailyEvents = [];
    
    // Determine the number of days to show based on timeframe
    const daysToShow = timeframe === 'day' 
      ? 24 // Show hourly data for 24 hours 
      : timeframe === 'month' 
        ? 30 // Show daily data for 30 days
        : 7; // Show daily data for 7 days
    
    if (timeframe === 'day') {
      // Hourly breakdown for the last 24 hours
      for (let i = 23; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 60 * 60 * 1000);
        const nextHour = new Date(date.getTime() + 60 * 60 * 1000);
        
        const count = await db.collection('analytics_events').countDocuments({
          timestamp: { 
            $gte: date.toISOString(),
            $lt: nextHour.toISOString()
          }
        });
        
        dailyEvents.push({
          date: `${date.getHours()}:00`,
          count
        });
      }
    } else {
      // Daily breakdown
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        
        const count = await db.collection('analytics_events').countDocuments({
          timestamp: { 
            $gte: date.toISOString(),
            $lt: nextDate.toISOString()
          }
        });
        
        dailyEvents.push({
          date: date.toISOString().split('T')[0],
          count
        });
      }
    }
    
    return res.status(200).json({
      totalEvents,
      eventCounts,
      topViewedJobs,
      topSearches,
      dailyEvents
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 