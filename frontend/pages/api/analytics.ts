import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../utils/mongodb';

// Types of events our analytics system can track
type EventType = 
  | 'page_view'
  | 'job_view' 
  | 'job_click' 
  | 'search' 
  | 'filter_change'
  | 'job_apply_click'
  | 'external_navigation';

interface AnalyticsPayload {
  event: EventType;
  timestamp?: string;
  sessionId?: string;
  userId?: string;
  page?: string;
  referrer?: string;
  searchQuery?: string;
  filterName?: string;
  filterValue?: string;
  jobId?: string;
  jobTitle?: string;
  company?: string;
  source?: string;
  destinationUrl?: string;
  [key: string]: any; // Allow additional properties
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
    
    // Basic validation
    if (!data.event) {
      return res.status(400).json({ error: 'Event type is required' });
    }
    
    // Enrich the event data
    const enrichedData = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
      serverTimestamp: new Date().toISOString(),
      clientIp: getClientIp(req),
      userAgent: req.headers['user-agent'],
      path: req.headers.referer || null,
      sessionId: data.sessionId || generateSessionId(req)
    };
    
    // In development, log to console for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Analytics] ${data.event}:`, enrichedData);
    } else {
      // In production, store the analytics data
      await storeAnalyticsData(enrichedData);
    }
    
    // If this is a job view, update the job document with view metrics
    if (data.event === 'job_view' && data.jobId) {
      try {
        await updateJobViewMetrics(data.jobId);
      } catch (error) {
        console.error('Failed to update job view metrics:', error);
        // Don't fail the request if job metrics update fails
      }
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
 * Generate a consistent session ID based on user properties
 */
function generateSessionId(req: NextApiRequest): string {
  const ip = getClientIp(req) || '';
  const userAgent = req.headers['user-agent'] || '';
  const date = new Date().toISOString().split('T')[0]; // Daily session reset
  
  // Create a simple hash (in production use a proper hashing library)
  let hash = 0;
  const str = `${ip}-${userAgent}-${date}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `session_${Math.abs(hash).toString(36)}`;
}

/**
 * Store analytics data
 */
async function storeAnalyticsData(data: AnalyticsPayload & { 
  serverTimestamp: string, 
  clientIp: string | null,
  userAgent?: string,
  path?: string | null
}): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    await db.collection('analytics_events').insertOne(data);
  } catch (error) {
    console.error('Failed to store analytics data:', error);
  }
}

/**
 * Update job view metrics
 */
async function updateJobViewMetrics(jobId: string): Promise<void> {
  try {
    const { db } = await connectToDatabase();
    
    await db.collection('jobs').updateOne(
      { _id: jobId },
      { 
        $inc: { 'engagementMetrics.viewCount': 1 },
        $set: { 'engagementMetrics.lastViewed': new Date() }
      },
      { upsert: false }
    );
  } catch (error) {
    console.error('Failed to update job view metrics:', error);
  }
} 