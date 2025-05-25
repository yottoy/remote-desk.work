import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/db/mongodb';
import { SubscriberModel } from '@/lib/db/subscriber';
import { rateLimit } from '@/lib/middleware/rateLimit';
import { errorHandler } from '@/lib/middleware/errorHandler';
import { UnsubscribeResponse } from '@/types/subscriber';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UnsubscribeResponse>
) {
  // Apply rate limiting
  await new Promise<void>((resolve) => {
    rateLimit()(req, res, () => resolve());
  });

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Connect to database
    await connectToDatabase();

    // Get token from query parameters
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Unsubscribe token is required'
      });
    }

    // Find and update subscriber
    const subscriber = await SubscriberModel.findOneAndUpdate(
      { unsubscribeToken: token, status: 'active' },
      { status: 'unsubscribed' },
      { new: true }
    );

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired unsubscribe token'
      });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed'
    });
  } catch (error) {
    return errorHandler(error as Error, req, res, () => {});
  }
} 