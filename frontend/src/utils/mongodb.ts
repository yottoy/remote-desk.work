import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'clickclickjob';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Global MongoDB client - prevents connections from being created on every request
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;
let isConnecting = false;

/**
 * Connect to MongoDB with retries
 * @param retries Number of retry attempts
 * @param delay Delay between retries in milliseconds
 */
async function connectWithRetry(retries = 3, delay = 1000): Promise<MongoClient> {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI as string, {
      // Add connection options for better reliability
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10
    });
    
    await client.connect();
    console.log('Connected to MongoDB successfully');
    return client;
  } catch (error) {
    if (retries <= 0) {
      console.error('Failed to connect to MongoDB after multiple attempts:', error);
      throw error;
    }
    console.warn(`Failed to connect to MongoDB, retrying in ${delay}ms...`, error);
    await new Promise(resolve => setTimeout(resolve, delay));
    return connectWithRetry(retries - 1, delay * 1.5);
  }
}

/**
 * Connect to MongoDB and return the client and database
 * Uses connection pooling to avoid creating a new connection for each request
 */
export async function connectToDatabase() {
  try {
    // If we're already connecting, wait for that to complete
    if (isConnecting) {
      console.log('Connection attempt already in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 100));
      return connectToDatabase();
    }

    // If the connection already exists, verify it's still alive
    if (cachedClient && cachedDb) {
      try {
        await cachedClient.db().command({ ping: 1 });
        console.log('Using cached database connection');
        return { client: cachedClient, db: cachedDb };
      } catch (error) {
        console.warn('Cached MongoDB connection is stale, reconnecting...', error);
        // Clean up stale connection
        try {
          await cachedClient.close();
        } catch (closeError) {
          console.warn('Error closing stale connection:', closeError);
        }
        cachedClient = null;
        cachedDb = null;
      }
    }

    // Start new connection
    isConnecting = true;
    try {
      const client = await connectWithRetry();
      const db = client.db(MONGODB_DB);

      // Verify we can access the jobs collection
      const collections = await db.listCollections().toArray();
      const hasJobsCollection = collections.some(c => c.name === 'jobs');
      if (!hasJobsCollection) {
        throw new Error(`Database ${MONGODB_DB} does not have a jobs collection`);
      }

      // Cache the connection
      cachedClient = client;
      cachedDb = db;

      console.log(`Connected to database: ${MONGODB_DB}`);
      return { client, db };
    } finally {
      isConnecting = false;
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Database connection failed. Please check your MongoDB connection settings.');
  }
} 