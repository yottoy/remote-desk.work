/**
 * Add Crawled But Not Indexed Jobs - January 25, 2026
 * 
 * Adds job IDs from Google Search Console "Crawled - currently not indexed" report
 * These are deleted jobs that Google is still crawling but not indexing.
 * 
 * Run: node scripts/add-crawled-not-indexed-jobs.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'clickclickjob';

// Path to CSV file
const csvPath = '/Users/yotamtroim/Downloads/clickclickjob-2/Table.csv';

async function addCrawledNotIndexedJobs() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  let client;
  try {
    // Read and parse CSV
    console.log('📖 Reading CSV file...');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n').slice(1); // Skip header
    
    console.log(`Found ${lines.length} URLs in CSV`);
    
    // Extract job IDs from URLs
    const jobIds = [];
    const nonJobUrls = [];
    
    for (const line of lines) {
      const url = line.split(',')[0]; // Get URL (first column)
      
      // Extract job ID from URL (24-character hex string)
      const match = url.match(/\/jobs\/([a-f0-9]{24})/);
      if (match) {
        jobIds.push(match[1]);
      } else {
        nonJobUrls.push(url);
      }
    }
    
    console.log(`\n📊 Analysis:`);
    console.log(`   Job URLs: ${jobIds.length}`);
    console.log(`   Non-job URLs: ${nonJobUrls.length}`);
    
    if (nonJobUrls.length > 0) {
      console.log(`\n⚠️  Non-job URLs found:`);
      nonJobUrls.slice(0, 10).forEach(url => console.log(`   - ${url}`));
      if (nonJobUrls.length > 10) {
        console.log(`   ... and ${nonJobUrls.length - 10} more`);
      }
    }
    
    if (jobIds.length === 0) {
      console.log('\n⚠️  No job IDs found to process');
      return;
    }

    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const deletedJobsCollection = db.collection('deleted_jobs');

    // Check which ones are already tracked
    const existing = await deletedJobsCollection.find({ 
      jobId: { $in: jobIds } 
    }).toArray();
    const existingIds = existing.map(j => j.jobId);
    const newIds = jobIds.filter(id => !existingIds.includes(id));

    console.log(`\n📊 Database Status:`);
    console.log(`   Already tracked: ${existingIds.length}`);
    console.log(`   New to add: ${newIds.length}`);

    if (newIds.length === 0) {
      console.log('\n✅ All job IDs already tracked. Nothing to do.');
      
      // Check total count
      const totalCount = await deletedJobsCollection.countDocuments();
      console.log(`\n📊 Total deleted jobs in database: ${totalCount}`);
      return;
    }

    // Prepare deletion date and expiry
    const deletionDate = new Date(); // Current date (when discovered)
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
            source: 'gsc-crawled-not-indexed-jan-25-2026'
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

    console.log('\n🎉 Done! All crawled-not-indexed jobs are now tracked.');
    console.log('\nNext steps:');
    console.log('1. These jobs will now return 410 Gone (no redeployment needed)');
    console.log('2. Test a few URLs to verify');
    console.log('3. GSC prefix removals will handle the rest');

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
addCrawledNotIndexedJobs().catch(console.error);
