import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

interface DbInfo {
  status: string;
  jobsCount?: number;
  database?: string;
  message?: string;
  stack?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Debug environment variables
    const envInfo = {
      MONGODB_URI: process.env.MONGODB_URI ? 'Set (starts with: ' + process.env.MONGODB_URI.substring(0, 20) + '...)' : 'Not set',
      MONGODB_DB: process.env.MONGODB_DB || 'Not set'
    };

    // Attempt to connect to database
    let dbInfo: DbInfo = { status: 'pending' };
    let collections: string[] = [];
    let sampleDocs: any[] = [];
    
    try {
      // Use direct connection approach instead of the utility function
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI not defined');
      }
      
      const client = new MongoClient(uri);
      await client.connect();
      
      const dbName = process.env.MONGODB_DB || 'clickclickjob';
      const db = client.db(dbName);
      
      // Check connection
      await db.command({ ping: 1 });
      dbInfo.status = 'connected';
      
      // List collections
      const collList = await db.listCollections().toArray();
      collections = collList.map(c => c.name);
      
      // Get sample docs and counts
      if (collections.includes('jobs')) {
        const count = await db.collection('jobs').countDocuments();
        
        // Get sample documents
        sampleDocs = await db.collection('jobs')
          .find({})
          .limit(3)
          .project({ title: 1, company: 1, _id: 0 })
          .toArray();
          
        // Add count information
        dbInfo = { 
          status: 'connected', 
          jobsCount: count,
          database: dbName
        };
      }
      
      await client.close();
    } catch (dbError: any) {
      dbInfo = { 
        status: 'error', 
        message: dbError.message,
        stack: dbError.stack
      };
    }
    
    // Return all diagnostic info
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envVariables: envInfo,
      database: dbInfo,
      collections,
      sampleDocs
    });
    
  } catch (error: any) {
    console.error('Diagnostic API error:', error);
    return res.status(500).json({ 
      error: 'API error', 
      message: error.message,
      stack: error.stack
    });
  }
} 