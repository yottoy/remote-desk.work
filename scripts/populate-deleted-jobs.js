/**
 * Populate Deleted Jobs Collection
 * 
 * This script populates the deleted_jobs collection with job IDs from the
 * GSC removal requests file. This ensures that accessing these deleted job
 * URLs returns 410 Gone instead of 404 Not Found.
 * 
 * Run: node scripts/populate-deleted-jobs.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'clickclickjob';

// Extract job IDs from the removal requests file
const removalsFile = path.join(__dirname, '../reports/gsc-removal-requests/url-list-2026-01-05.txt');

async function populateDeletedJobs() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  let client;
  try {
    // Read the URLs file
    console.log('📖 Reading deleted job URLs...');
    const fileContent = fs.readFileSync(removalsFile, 'utf-8');
    const urls = fileContent.trim().split('\n').filter(line => line.trim());
    
    console.log(`Found ${urls.length} deleted job URLs`);

    // Extract job IDs from URLs
    const jobIds = urls.map(url => {
      const match = url.match(/\/jobs\/([a-f0-9]{24})/);
      return match ? match[1] : null;
    }).filter(id => id !== null);

    console.log(`Extracted ${jobIds.length} job IDs`);

    if (jobIds.length === 0) {
      console.log('⚠️  No job IDs found to process');
      return;
    }

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const deletedJobsCollection = db.collection('deleted_jobs');

    // Prepare deletion date and expiry
    const deletionDate = new Date('2026-01-05T23:23:00.000Z'); // From the CSV file
    const expiresAt = new Date(deletionDate);
    expiresAt.setDate(expiresAt.getDate() + 90); // Keep for 90 days

    // Build bulk operations
    const operations = jobIds.map(jobId => ({
      updateOne: {
        filter: { jobId },
        update: {
          $set: {
            jobId,
            deletedAt: deletionDate,
            expiresAt,
            originalTitle: 'N/A',
            originalCompany: 'N/A',
            source: 'gsc-removal-request-2026-01-05'
          }
        },
        upsert: true
      }
    }));

    // Execute bulk write
    console.log(`📝 Inserting ${operations.length} deleted job records...`);
    const result = await deletedJobsCollection.bulkWrite(operations);

    console.log('\n✅ Successfully populated deleted_jobs collection:');
    console.log(`   - Matched: ${result.matchedCount}`);
    console.log(`   - Modified: ${result.modifiedCount}`);
    console.log(`   - Upserted: ${result.upsertedCount}`);

    // Create TTL index if it doesn't exist
    console.log('\n🔧 Setting up indexes...');
    await deletedJobsCollection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );
    await deletedJobsCollection.createIndex(
      { jobId: 1 },
      { unique: true }
    );
    console.log('✅ Indexes created');

    // Verify the data
    const count = await deletedJobsCollection.countDocuments();
    console.log(`\n📊 Total deleted jobs in collection: ${count}`);

    console.log('\n🎉 Done! Deleted jobs are now tracked.');
    console.log('\nNext steps:');
    console.log('1. Deploy this change to production');
    console.log('2. Verify a deleted job URL returns 410 Gone:');
    console.log('   curl -I https://www.clickclickjob.com/jobs/683c4ea744abe4d1de8a8d25');
    console.log('3. Submit removal requests to Google Search Console');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

// Run the script
populateDeletedJobs().catch(console.error);
