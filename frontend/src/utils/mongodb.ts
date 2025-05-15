import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'clickclickjob';

// Global MongoDB client - prevents connections from being created on every request
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable'
  );
}

/**
 * Connect to MongoDB and return the client and database
 * Uses connection pooling to avoid creating a new connection for each request
 */
export async function connectToDatabase() {
  // If the connection already exists, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Create a new connection
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  return { client, db };
} 