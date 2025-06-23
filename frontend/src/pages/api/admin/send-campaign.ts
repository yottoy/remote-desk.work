import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { campaignId } = req.body;
  
  if (!campaignId) {
    return res.status(400).json({ error: 'Campaign ID is required' });
  }

  const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
  
  if (!MAILERLITE_API_KEY) {
    return res.status(500).json({ error: 'MailerLite API key not configured' });
  }

  try {
    console.log(`Attempting to send campaign ${campaignId}...`);
    
    // Use the correct MailerLite API endpoint for scheduling campaigns
    const scheduleResponse = await fetch(`https://connect.mailerlite.com/api/campaigns/${campaignId}/schedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        delivery: "instant"
      })
    });

    if (scheduleResponse.ok) {
      const scheduleResult = await scheduleResponse.json();
      console.log('Campaign scheduled successfully:', scheduleResult);
      return res.status(200).json({
        message: 'Campaign sent successfully!',
        method: 'schedule',
        result: scheduleResult
      });
    }

    const scheduleError = await scheduleResponse.text();
    console.log('Schedule endpoint failed:', scheduleResponse.status, scheduleError);

    // Try alternative send endpoint
    const sendResponse = await fetch(`https://connect.mailerlite.com/api/campaigns/${campaignId}/actions/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (sendResponse.ok) {
      const sendResult = await sendResponse.json();
      console.log('Campaign sent via actions/send:', sendResult);
      return res.status(200).json({
        message: 'Campaign sent successfully',
        method: 'actions/send',
        result: sendResult
      });
    }

    const sendError = await sendResponse.text();
    console.log('Actions/send endpoint also failed:', sendResponse.status, sendError);

    // Return error details
    return res.status(400).json({
      error: 'Failed to send campaign',
      details: {
        status: scheduleResponse.status,
        message: scheduleError
      },
      sendError: {
        status: sendResponse.status,
        message: sendError
      }
    });

  } catch (error) {
    console.error('Error sending campaign:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 