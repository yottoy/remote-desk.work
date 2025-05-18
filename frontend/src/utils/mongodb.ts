import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clickclickjob';
const MONGODB_DB = process.env.MONGODB_DB || 'clickclickjob';

// Handle caching of the MongoDB connection
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

// Connect to MongoDB and cache the connection
export async function connectToDatabase() {
  // If we have cached values, use them
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Connect to MongoDB
  try {
    if (!MONGODB_URI) {
      throw new Error(
        'Please define the MONGODB_URI environment variable'
      );
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    // Get the database
    const db = client.db(MONGODB_DB);
    
    // Cache the client and connection
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return { client: null, db: null };
  }
}

// Validate a job object to ensure it's not a mock/invalid job
export function isValidJob(job: any): boolean {
  if (!job) return false;
  
  // Basic validation - job must have these fields
  if (!job._id || !job.title || !job.company) return false;
  
  // Validate job ID to ensure it's not a mock ID pattern
  if (/^job\d+$/.test(job._id)) return false;
  
  // Check that the job doesn't have any mock flags
  if (job.isMock || job.is_mock_data) return false;
  
  // Check for suspicious URLs
  if (job.url && /example\.com|placeholder|test|mock/.test(job.url)) return false;
  
  return true;
}

// Special function to clean up any remaining mock jobs from the database
// This runs automatically when the server starts in production
export async function cleanupMockEntries() {
  console.log('Running mock job cleanup...');
  
  try {
    const { db } = await connectToDatabase();
    if (!db) {
      console.error('Failed to connect to the database for cleanup');
      return;
    }
    
    const jobsCollection = db.collection('jobs');
    
    // Define patterns for identifying mock jobs
    // These are various patterns that might indicate mock jobs
    const mockPatterns = [
      { _id: { $regex: /^job\d+$/ } },
      { url: { $regex: /example\.com|placeholder|test|mock/ } },
      { isMock: true },
      { is_mock_data: true },
      { title: { $regex: /^\[MOCK\]/ } },
      { company: { $regex: /^\[MOCK\]/ } }
    ];
    
    // Find and delete all mock jobs
    const result = await jobsCollection.deleteMany({
      $or: mockPatterns
    });
    
    console.log(`Removed ${result.deletedCount} mock job entries from the database`);
  } catch (error) {
    console.error('Error cleaning up mock entries:', error);
  }
}

// Run the cleanup on server start if in production
if (process.env.NODE_ENV === 'production') {
  cleanupMockEntries().catch(error => {
    console.error('Failed to run mock cleanup on startup:', error);
  });
} 