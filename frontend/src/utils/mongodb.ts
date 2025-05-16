import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'clickclickjob';

// Global MongoDB client - prevents connections from being created on every request
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;
let connectionPromise: Promise<any> | null = null;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not defined');
}

/**
 * Connect to MongoDB with retries
 * @param retries Number of retry attempts
 * @param delay Delay between retries in milliseconds
 */
async function connectWithRetry(retries = 3, delay = 1000) {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
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
  // If we're already connecting, wait for that to complete
  if (connectionPromise) {
    try {
      await connectionPromise;
    } catch (error) {
      console.error('Error waiting for existing connection:', error);
      connectionPromise = null;
    }
  }

  // If the connection already exists, use it
  if (cachedClient && cachedDb) {
    // Verify the connection is still alive
    try {
      await cachedClient.db().command({ ping: 1 });
      return { client: cachedClient, db: cachedDb };
    } catch (error) {
      console.warn('Cached MongoDB connection is stale, reconnecting...', error);
      // Connection is stale, continue to reconnect
    }
  }

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  try {
    // Create the connection promise to ensure we only have one connection attempt at a time
    connectionPromise = connectWithRetry();
    
    // Connect with retry mechanism
    const client = await connectionPromise;
    const db = client.db(MONGODB_DB);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;
    connectionPromise = null;

    return { client, db };
  } catch (error) {
    connectionPromise = null;
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
} 