import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Health check endpoint
 * This helps verify that the API routes are working properly on Vercel
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ 
    status: 'healthy',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    name: process.env.SITE_NAME || 'ClickClickJob.com'
  });
} 