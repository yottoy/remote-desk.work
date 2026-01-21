#!/usr/bin/env node

/**
 * Generate GSC URL Removal Requests
 * 
 * Creates a list of deleted job URLs that should be submitted
 * to Google Search Console for removal/update.
 * 
 * Output: A CSV and JSON file with URLs to remove
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.clickclickjob.com';

async function generateRemovalRequests() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    const deletedCollection = db.collection('deleted_jobs');
    
    // Get all deleted jobs
    console.log('\n📊 Fetching deleted jobs...');
    const deletedJobs = await deletedCollection
      .find({})
      .sort({ deletedAt: -1 })
      .toArray();
    
    console.log(`   Found ${deletedJobs.length} deleted jobs`);
    
    if (deletedJobs.length === 0) {
      console.log('\n✅ No deleted jobs to process!');
      return;
    }
    
    // Generate URLs
    const urls = deletedJobs.map(job => ({
      url: `${BASE_URL}/jobs/${job.jobId}`,
      deletedAt: job.deletedAt.toISOString(),
      originalTitle: job.originalTitle || 'N/A',
      originalCompany: job.originalCompany || 'N/A',
    }));
    
    // Create output directory
    const outputDir = path.join(__dirname, '..', 'reports', 'gsc-removal-requests');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Write JSON file
    const jsonPath = path.join(outputDir, `removal-requests-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(urls, null, 2));
    console.log(`\n📄 Created JSON: ${jsonPath}`);
    
    // Write CSV file for easy import
    const csvPath = path.join(outputDir, `removal-requests-${timestamp}.csv`);
    const csvContent = [
      'URL,Deleted At,Original Title,Original Company',
      ...urls.map(u => 
        `"${u.url}","${u.deletedAt}","${u.originalTitle.replace(/"/g, '""')}","${u.originalCompany.replace(/"/g, '""')}"`
      )
    ].join('\n');
    fs.writeFileSync(csvPath, csvContent);
    console.log(`📄 Created CSV: ${csvPath}`);
    
    // Write simple URL list (one per line) for bulk operations
    const urlListPath = path.join(outputDir, `url-list-${timestamp}.txt`);
    fs.writeFileSync(urlListPath, urls.map(u => u.url).join('\n'));
    console.log(`📄 Created URL list: ${urlListPath}`);
    
    console.log('\n📊 Summary:');
    console.log(`   Total URLs: ${urls.length}`);
    
    // Group by deletion date
    const byDate = urls.reduce((acc, u) => {
      const date = u.deletedAt.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n   Deletions by date:');
    Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10)
      .forEach(([date, count]) => {
        console.log(`   ${date}: ${count} URLs`);
      });
    
    console.log('\n✅ Files generated successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Go to Google Search Console > Removals');
    console.log('2. Click "Outdated Content"');
    console.log('3. Submit each URL or use the URL list for batch removal');
    console.log('4. Alternatively, wait for Google to recrawl (can take weeks)');
    console.log('5. The 410 Gone responses will help Google understand these are permanently deleted');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

generateRemovalRequests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

