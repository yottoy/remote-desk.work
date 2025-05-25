import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/db/mongodb';
import { HealthResponse } from '@/types/subscriber';

/**
 * Health check endpoint
 * This helps verify that the API routes are working properly on Vercel
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    // Check database connection
    await connectToDatabase();

    // Return success response
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Return error response
    return res.status(500).end();
  }
} 