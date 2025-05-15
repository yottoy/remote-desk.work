import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../utils/mongodb';

/**
 * Health check endpoint
 * This helps verify that the API routes are working properly on Vercel
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check MongoDB connection
  let databaseStatus = {
    connected: false,
    collectionCounts: {} as Record<string, number>,
    error: null as string | null
  };

  try {
    const { db } = await connectToDatabase();
    
    // Get collection names
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c: { name: string }) => c.name);
    
    // Count documents in each collection
    for (const name of collectionNames) {
      databaseStatus.collectionCounts[name] = await db.collection(name).countDocuments();
    }
    
    databaseStatus.connected = true;
  } catch (error: any) {
    databaseStatus.connected = false;
    databaseStatus.error = error.message || 'Unknown MongoDB connection error';
  }

  // Return health status
  res.status(200).json({
    status: 'ok',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: databaseStatus
  });
} 