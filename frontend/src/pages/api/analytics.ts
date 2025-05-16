import { NextApiRequest, NextApiResponse } from 'next';

interface AnalyticsPayload {
  eventType: string;
  payload: {
    userId: string;
    sessionId: string;
    timestamp: string;
    [key: string]: any;
  };
}

/**
 * API handler for analytics events
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const data = req.body as AnalyticsPayload;
    
    // Validate required fields
    if (!data.eventType || !data.payload || !data.payload.userId) {
      return res.status(400).json({ error: 'Invalid analytics data format' });
    }
    
    // Add server timestamp to compare with client timestamp (helps detect timing issues)
    const eventWithServerTimestamp = {
      ...data,
      serverTimestamp: new Date().toISOString(),
      clientIp: getClientIp(req),
    };
    
    // In a real implementation, we would:
    // 1. Store in database (MongoDB, BigQuery, etc.)
    // 2. Send to analytics service (Segment, Mixpanel, etc.)
    // 3. Log to file or stream
    
    // For this demo, we'll just log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Analytics] ${data.eventType}:`, data.payload);
    } else {
      // In production we would store this data
      await storeAnalyticsData(eventWithServerTimestamp);
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({ error: 'Internal server error processing analytics' });
  }
}

/**
 * Get client IP address from request
 */
function getClientIp(req: NextApiRequest): string | null {
  // Get IP from various headers (depending on if there's a proxy, etc.)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]) 
    : req.socket.remoteAddress;
  
  return ip || null;
}

/**
 * Store analytics data
 * In a real implementation, this would save to a database
 */
async function storeAnalyticsData(data: AnalyticsPayload & { serverTimestamp: string, clientIp: string | null }): Promise<void> {
  // This is where you would implement your actual storage
  // For example, with MongoDB:
  /*
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB);
  await db.collection('analytics_events').insertOne(data);
  await client.close();
  */
  
  // Or with a third-party analytics service
  /*
  await fetch('https://your-analytics-service.com/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'API-Key': process.env.ANALYTICS_API_KEY },
    body: JSON.stringify(data)
  });
  */
  
  // For now, we'll just write to console
  console.log(`[Analytics Storage] ${data.eventType} event saved`);
} 