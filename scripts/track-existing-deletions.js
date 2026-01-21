#!/usr/bin/env node

/**
 * Track Existing Job Deletions
 * 
 * This script analyzes the Google Search Console data to identify
 * jobs that were indexed but are now deleted, and adds them to
 * the deleted_jobs tracking collection.
 * 
 * This is a one-time migration script for existing deletions.
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

async function trackExistingDeletions() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    const jobsCollection = db.collection('jobs');
    const deletedCollection = db.collection('deleted_jobs');
    
    // Read GSC Table.csv with URLs that are "Crawled - currently not indexed"
    const csvPath = path.join(process.env.HOME, 'Downloads/clickclickjob/Table.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('⚠️  GSC Table.csv not found at:', csvPath);
      console.log('   Please provide the CSV file or run this after downloading GSC data');
      return;
    }
    
    console.log('\n📊 Reading GSC data...');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    const jobUrls = lines
      .filter(line => line.trim())
      .map(line => {
        const [url] = line.split(',');
        return url.trim();
      })
      .filter(url => url.includes('/jobs/'));
    
    console.log(`   Found ${jobUrls.length} job URLs from GSC data`);
    
    // Extract job IDs from URLs
    const jobIds = jobUrls.map(url => {
      const match = url.match(/\/jobs\/([^/?]+)/);
      return match ? match[1] : null;
    }).filter(Boolean);
    
    console.log(`   Extracted ${jobIds.length} job IDs`);
    
    // Check which IDs are NOT in the current jobs collection
    console.log('\n🔍 Checking for deleted jobs...');
    
    let trackedCount = 0;
    let alreadyExists = 0;
    let stillExists = 0;
    
    for (const jobId of jobIds) {
      // Check if job still exists
      let jobExists = false;
      
      if (ObjectId.isValid(jobId)) {
        jobExists = await jobsCollection.findOne({ _id: new ObjectId(jobId) }) !== null;
      }
      
      if (!jobExists) {
        jobExists = await jobsCollection.findOne({
          $or: [
            { _id: jobId },
            { uniqueIdentifier: jobId }
          ]
        }) !== null;
      }
      
      if (jobExists) {
        stillExists++;
        continue;
      }
      
      // Job was deleted - track it
      const deletionDate = new Date();
      const expiresAt = new Date(deletionDate);
      expiresAt.setDate(expiresAt.getDate() + 90);
      
      try {
        await deletedCollection.updateOne(
          { jobId },
          {
            $set: {
              jobId,
              deletedAt: deletionDate,
              expiresAt,
              source: 'gsc_migration',
              originalUrl: jobUrls[jobIds.indexOf(jobId)],
            }
          },
          { upsert: true }
        );
        trackedCount++;
      } catch (error) {
        if (error.code === 11000) { // Duplicate key
          alreadyExists++;
        } else {
          throw error;
        }
      }
      
      // Progress indicator
      if ((trackedCount + alreadyExists + stillExists) % 50 === 0) {
        process.stdout.write('.');
      }
    }
    
    console.log('\n\n✅ Migration complete!');
    console.log('\n📊 Results:');
    console.log(`   ✅ Tracked ${trackedCount} deleted jobs`);
    console.log(`   ℹ️  ${alreadyExists} already tracked`);
    console.log(`   ⚠️  ${stillExists} jobs still exist in database`);
    console.log(`   📝 Total processed: ${jobIds.length}`);
    
    // Show stats
    const totalTracked = await deletedCollection.countDocuments();
    console.log(`\n📊 Total tracked deleted jobs: ${totalTracked}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

trackExistingDeletions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

