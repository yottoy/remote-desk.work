import { NextApiRequest, NextApiResponse } from 'next';
import generateJobReport from '../../../../scripts/generate-job-report';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  try {
    await generateJobReport();
    res.status(200).json({ success: true, message: 'Report generated and sent successfully' });
  } catch (error) {
    console.error('Error in cron job:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
} 