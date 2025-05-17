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
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 20
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
      await new Promise(resolve => setTimeout(resolve, 100));
      return connectToDatabase();
    }

    // If the connection already exists, verify it's still alive with a simple ping
    if (cachedClient && cachedDb) {
      try {
        await cachedClient.db().command({ ping: 1 });
        return { client: cachedClient, db: cachedDb };
      } catch (error) {
        console.warn('Cached MongoDB connection is stale, reconnecting...');
        try {
          await cachedClient.close();
        } catch (closeError) {
          console.warn('Error closing stale connection');
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

      // Cache the connection
      cachedClient = client;
      cachedDb = db;

      return { client, db };
    } finally {
      isConnecting = false;
    }
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Database connection failed');
  }
} 