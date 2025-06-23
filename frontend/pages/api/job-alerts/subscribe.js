import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'clickclickjob';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, preferences } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid email address' 
      });
    }

    // Create subscription record
    const subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      preferences: {
        frequency: preferences?.frequency || 'weekly',
        keywords: preferences?.keywords || ['remote', 'administrative'],
        salary_range: preferences?.salary_range || { min: 30000, max: 80000 },
        categories: preferences?.categories || ['administrative', 'data-entry'],
        job_types: preferences?.job_types || ['full-time', 'part-time']
      },
      status: 'active',
      verification_token: Math.random().toString(36).substr(2, 15),
      created_at: new Date().toISOString(),
      last_email_sent: null,
      email_count: 0,
      source: 'website_signup'
    };

    // Mock database operation (in real implementation, save to MongoDB)
    console.log('Job Alert Subscription Created:', subscription);

    res.status(201).json({
      success: true,
      message: `Successfully subscribed ${email} to ${subscription.preferences.frequency} job alerts!`,
      subscription_id: subscription.id,
      preferences: subscription.preferences,
      next_email: getNextEmailDate(subscription.preferences.frequency)
    });

  } catch (error) {
    console.error('Job Alert Subscription Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to create subscription'
    });
  }
}

function getNextEmailDate(frequency) {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    default:
      now.setDate(now.getDate() + 7);
  }
  return now.toISOString();
} 