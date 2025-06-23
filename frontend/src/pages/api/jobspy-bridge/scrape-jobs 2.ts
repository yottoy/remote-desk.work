import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable inside .env.local');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sites, keywords, location } = req.body;

    if (!sites || !Array.isArray(sites) || sites.length === 0) {
      return res.status(400).json({ error: 'Sites array is required' });
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'Keywords array is required' });
    }

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI as string);
    const db = client.db(MONGODB_DB);

    // Get jobs collection
    const jobsCollection = db.collection('jobs');

    // Find jobs matching the criteria
    const jobs = await jobsCollection.find({
      site: { $in: sites },
      keywords: { $in: keywords },
      location: { $regex: new RegExp(location, 'i') },
      postedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).toArray();

    // Close MongoDB connection
    await client.close();

    return res.status(200).json({
      status: 'success',
      jobs: jobs
    });
  } catch (error) {
    console.error('Job scraping error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 