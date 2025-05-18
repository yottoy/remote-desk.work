import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.REVALIDATION_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  try {
    // Get the path to revalidate from the request
    const path = req.query.path as string;
    
    if (!path) {
      return res.status(400).json({ message: 'Path is required' });
    }

    console.log(`Revalidating path: ${path}`);
    
    // This revalidation mechanism works with Next.js ISR
    await res.revalidate(path);
    
    return res.json({ 
      revalidated: true,
      message: `Path ${path} revalidated successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    // If there was an error, Next.js will continue to show the last successfully generated page
    return res.status(500).send('Error revalidating');
  }
} 