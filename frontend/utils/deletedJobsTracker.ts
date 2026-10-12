/**
 * Deleted Jobs Tracker
 * 
 * Tracks deleted job IDs to return proper 410 Gone HTTP status
 * instead of soft 404s (redirects) which confuse search engines.
 * 
 * This helps with Google Search Console "Crawled - currently not indexed" issue.
 */

import { Db } from 'mongodb';
import { connectToDatabase } from './mongodb';

// Reuse the app's shared connection; a second client per instance doubled
// the connections opened during crawler bursts.
async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable');
  }
  return db;
}

/**
 * Track a deleted job ID
 * Stores the job ID with deletion timestamp and original job data
 */
export async function trackDeletedJob(
  jobId: string,
  jobData?: {
    title?: string;
    company?: string;
    url?: string;
  }
): Promise<void> {
  try {
    const db = await getDatabase();
    const collection = db.collection('deleted_jobs');

    // Store deleted job with TTL (auto-delete after 90 days)
    const deletionDate = new Date();
    const expiresAt = new Date(deletionDate);
    expiresAt.setDate(expiresAt.getDate() + 90); // Keep for 90 days

    await collection.updateOne(
      { jobId },
      {
        $set: {
          jobId,
          deletedAt: deletionDate,
          expiresAt,
          ...(jobData && {
            originalTitle: jobData.title,
            originalCompany: jobData.company,
            originalUrl: jobData.url,
          }),
        },
      },
      { upsert: true }
    );

    console.log(`✅ Tracked deleted job: ${jobId}`);
  } catch (error) {
    console.error('Error tracking deleted job:', error);
    // Don't throw - this is not critical to job deletion
  }
}

/**
 * Track multiple deleted jobs (bulk operation)
 */
export async function trackDeletedJobs(
  jobIds: string[],
  jobsData?: Map<string, { title?: string; company?: string; url?: string }>
): Promise<void> {
  try {
    const db = await getDatabase();
    const collection = db.collection('deleted_jobs');

    const deletionDate = new Date();
    const expiresAt = new Date(deletionDate);
    expiresAt.setDate(expiresAt.getDate() + 90);

    const operations = jobIds.map((jobId) => ({
      updateOne: {
        filter: { jobId },
        update: {
          $set: {
            jobId,
            deletedAt: deletionDate,
            expiresAt,
            ...(jobsData?.has(jobId) && {
              originalTitle: jobsData.get(jobId)?.title,
              originalCompany: jobsData.get(jobId)?.company,
              originalUrl: jobsData.get(jobId)?.url,
            }),
          },
        },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(operations);
    console.log(`✅ Tracked ${result.upsertedCount} deleted jobs`);
  } catch (error) {
    console.error('Error tracking deleted jobs:', error);
  }
}

/**
 * Check if a job ID was deleted
 * Returns true if the job was previously deleted
 */
export async function wasJobDeleted(jobId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const collection = db.collection('deleted_jobs');

    const deletedJob = await collection.findOne({ jobId });
    return deletedJob !== null;
  } catch (error) {
    console.error('Error checking deleted job:', error);
    return false;
  }
}

/**
 * Get deleted job info (for logging/debugging)
 */
export async function getDeletedJobInfo(jobId: string): Promise<{
  deletedAt: Date;
  originalTitle?: string;
  originalCompany?: string;
} | null> {
  try {
    const db = await getDatabase();
    const collection = db.collection('deleted_jobs');

    const deletedJob = await collection.findOne({ jobId });
    
    if (!deletedJob) {
      return null;
    }

    return {
      deletedAt: deletedJob.deletedAt,
      originalTitle: deletedJob.originalTitle,
      originalCompany: deletedJob.originalCompany,
    };
  } catch (error) {
    console.error('Error getting deleted job info:', error);
    return null;
  }
}

/**
 * Setup TTL index for auto-cleanup
 * Run this once during deployment or in a migration script
 */
export async function setupDeletedJobsCollection(): Promise<void> {
  try {
    const db = await getDatabase();
    const collection = db.collection('deleted_jobs');

    // Create TTL index to auto-delete after 90 days
    await collection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );

    // Create index on jobId for fast lookups
    await collection.createIndex({ jobId: 1 }, { unique: true });

    console.log('✅ Deleted jobs collection indexes created');
  } catch (error) {
    console.error('Error setting up deleted jobs collection:', error);
    throw error;
  }
}

