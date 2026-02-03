import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  return res.status(200).json({
    receivedAuth: authHeader || 'none',
    expectedFormat: `Bearer ${cronSecret}`,
    cronSecretExists: !!cronSecret,
    cronSecretLength: cronSecret?.length || 0,
    matches: authHeader === `Bearer ${cronSecret}`,
    cronSecretFirstChars: cronSecret?.substring(0, 10) || 'none',
    receivedFirstChars: authHeader?.substring(0, 17) || 'none'
  });
}
