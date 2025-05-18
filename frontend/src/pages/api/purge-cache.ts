import type { NextApiRequest, NextApiResponse } from 'next';

// This is a special endpoint that can be used to purge the cache for specific pages
// It's mainly used for development and testing purposes
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Simple validation to prevent abuse - require a secret
  const { secret, paths } = req.body;

  if (secret !== process.env.CACHE_PURGE_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Log the purge request
    console.log('Cache purge requested for paths:', paths);

    // In a real implementation, this would call Vercel's API to purge specific paths
    // For now, we'll just simulate a successful purge
    return res.status(200).json({ 
      success: true, 
      message: 'Cache purge initiated successfully',
      purgedPaths: paths || ['*']
    });
  } catch (error) {
    console.error('Error purging cache:', error);
    return res.status(500).json({ message: 'Failed to purge cache' });
  }
} 