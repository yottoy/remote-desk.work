import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../utils/mongodb';

/**
 * Health check endpoint
 * This helps verify that the API routes are working properly on Vercel
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check MongoDB connection
    const start = Date.now();
    const { db } = await connectToDatabase();
    const dbConnectTime = Date.now() - start;
    
    // If we got this far, the connection was successful
    // Perform a simple query to ensure the database is working
    const pingResult = await db.command({ ping: 1 });
    const dbQueryTime = Date.now() - start - dbConnectTime;
    
    // Get basic database stats
    let dbStats = null;
    let jobsCount = 0;
    
    try {
      dbStats = await db.stats();
      jobsCount = await db.collection('jobs').countDocuments();
    } catch (err) {
      console.error('Error fetching database stats:', err);
    }
    
    // Return health information
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: true,
        connectionTime: `${dbConnectTime}ms`,
        queryTime: `${dbQueryTime}ms`,
        totalTime: `${Date.now() - start}ms`,
        name: db.databaseName,
        collections: dbStats?.collections || 'unknown',
        jobsCount
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        nodeVersion: process.version
      }
    });
  }
} 