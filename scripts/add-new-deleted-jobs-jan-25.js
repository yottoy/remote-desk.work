/**
 * Add New Deleted Jobs - January 25, 2026
 * 
 * Adds 54 additional deleted job IDs found in recent 404 reports (Jan 6-23, 2026)
 * These are jobs deleted AFTER the initial January 5 cleanup.
 * 
 * Run: node scripts/add-new-deleted-jobs-jan-25.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'clickclickjob';

// New job IDs from 404 reports (Jan 6-23, 2026)
const newDeletedJobIds = [
  '6872b48aaec91b61d00f77da',
  '694f5d26b51fd39530ac4cb1',
  '6872b48aaec91b61d00f77e3',
  '6872b48baec91b61d00f783e',
  '6959a079b51fd39530b0936b',
  '6959a079b51fd39530b09386',
  '6959a079b51fd39530b09364',
  '6959a079b51fd39530b0936a',
  '696a6a78b79ef545ca3087a9',
  '696a6a78b79ef545ca3087aa',
  '696a6a78b79ef545ca3087a8',
  '696a6a78b79ef545ca3087a7',
  '6959a079b51fd39530b09388',
  '6959a079b51fd39530b09358',
  '6872b48aaec91b61d00f77df',
  '6959a079b51fd39530b09351',
  '685bd1462ac39e3b087e69a0',
  '6872b48aaec91b61d00f762b',
  '6959a079b51fd39530b09372',
  '694f5d26b51fd39530ac4ce4',
  '694f5d29b51fd39530ac4ee4',
  '6959a079b51fd39530b09366',
  '6872b48aaec91b61d00f765f',
  '6872b48baec91b61d00f780d',
  '6872b489aec91b61d00f73e5',
  '6959a079b51fd39530b09369',
  '6959a079b51fd39530b09383',
  '6959a079b51fd39530b09368',
  '6959a079b51fd39530b09353',
  '6959a079b51fd39530b09352',
  '6959a079b51fd39530b09370',
  '6959a079b51fd39530b09362',
  '695878fdb51fd39530aee461',
  '6959a079b51fd39530b09373',
  '6959a079b51fd39530b09361',
  '6959a079b51fd39530b0935a',
  '6959a079b51fd39530b09374',
  '6959a079b51fd39530b09377',
  '6959a079b51fd39530b0936e',
  '6959a079b51fd39530b0935e',
  '6959a079b51fd39530b09382',
  '6959a079b51fd39530b0935b',
  '6959a079b51fd39530b09354',
  '6959a079b51fd39530b0937f',
  '6959a079b51fd39530b0937c',
  '6959a079b51fd39530b09367',
  '6959a079b51fd39530b0936d',
  '6959a079b51fd39530b0937a',
  '6959a079b51fd39530b09385',
  '6959a079b51fd39530b0935c',
  '6959a079b51fd39530b09355',
  '6959a079b51fd39530b09357',
  '6959a079b51fd39530b0936c',
  '6959a079b51fd39530b0935d'
];

async function addNewDeletedJobs() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  let client;
  try {
    console.log(`📋 Adding ${newDeletedJobIds.length} new deleted job IDs...`);

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const deletedJobsCollection = db.collection('deleted_jobs');

    // Check which ones are already tracked
    const existing = await deletedJobsCollection.find({ 
      jobId: { $in: newDeletedJobIds } 
    }).toArray();
    const existingIds = existing.map(j => j.jobId);
    const newIds = newDeletedJobIds.filter(id => !existingIds.includes(id));

    console.log(`\n📊 Status:`);
    console.log(`   Already tracked: ${existingIds.length}`);
    console.log(`   New to add: ${newIds.length}`);

    if (newIds.length === 0) {
      console.log('\n✅ All jobs already tracked. Nothing to do.');
      return;
    }

    // Prepare deletion date and expiry
    const deletionDate = new Date(); // Current date (when they were discovered)
    const expiresAt = new Date(deletionDate);
    expiresAt.setDate(expiresAt.getDate() + 90); // Keep for 90 days

    // Build bulk operations
    const operations = newIds.map(jobId => ({
      updateOne: {
        filter: { jobId },
        update: {
          $set: {
            jobId,
            deletedAt: deletionDate,
            expiresAt,
            originalTitle: 'N/A',
            originalCompany: 'N/A',
            source: '404-report-jan-6-to-23-2026'
          }
        },
        upsert: true
      }
    }));

    // Execute bulk write
    console.log(`\n📝 Inserting ${operations.length} new deleted job records...`);
    const result = await deletedJobsCollection.bulkWrite(operations);

    console.log('\n✅ Successfully added new deleted jobs:');
    console.log(`   - Matched: ${result.matchedCount}`);
    console.log(`   - Modified: ${result.modifiedCount}`);
    console.log(`   - Upserted: ${result.upsertedCount}`);

    // Verify the total count
    const totalCount = await deletedJobsCollection.countDocuments();
    console.log(`\n📊 Total deleted jobs now tracked: ${totalCount}`);
    console.log(`   (Previous: 230, Added: ${newIds.length}, Total: ${totalCount})`);

    console.log('\n🎉 Done! New deleted jobs are now tracked.');
    console.log('\nNext steps:');
    console.log('1. These jobs will now return 410 Gone (no redeployment needed)');
    console.log('2. Test a few URLs to verify:');
    console.log('   curl -I https://www.clickclickjob.com/jobs/6959a079b51fd39530b0936b');
    console.log('3. Submit additional GSC removal requests for new prefixes:');
    console.log('   - https://www.clickclickjob.com/jobs/6959');
    console.log('   - https://www.clickclickjob.com/jobs/696a');
    console.log('   - https://www.clickclickjob.com/jobs/694f');

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
addNewDeletedJobs().catch(console.error);
