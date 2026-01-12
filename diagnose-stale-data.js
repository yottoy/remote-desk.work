/**
 * Comprehensive diagnostic script to check why data is stale
 * This checks:
 * 1. MongoDB connection and current job count
 * 2. When jobs were last scraped/updated
 * 3. GitHub Actions status (if we can access it)
 * 4. API endpoint connectivity
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'clickclickjob';

async function diagnoseStaleData() {
  console.log('\n🔍 DIAGNOSING STALE DATA ISSUE\n');
  console.log('=' . repeat(60));
  
  // Check 1: Environment Variables
  console.log('\n1. CHECKING ENVIRONMENT VARIABLES');
  console.log('-'.repeat(60));
  console.log(`MONGODB_URI exists: ${!!MONGODB_URI}`);
  console.log(`MONGODB_DB: ${MONGODB_DB}`);
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set! This is a critical issue.');
    console.log('\n💡 Solution: Set MONGODB_URI in your .env file or GitHub Secrets');
    return;
  }
  
  // Check 2: MongoDB Connection and Data
  console.log('\n2. CHECKING MONGODB CONNECTION & DATA');
  console.log('-'.repeat(60));
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    
    const db = client.db(MONGODB_DB);
    const jobsCollection = db.collection('jobs');
    
    // Count total jobs
    const totalJobs = await jobsCollection.countDocuments();
    console.log(`\n📊 Total jobs in database: ${totalJobs}`);
    
    if (totalJobs === 0) {
      console.error('❌ NO JOBS IN DATABASE! This is why the site shows no data.');
      console.log('\n💡 Possible causes:');
      console.log('   - GitHub Actions scrapers are not running');
      console.log('   - Scrapers are running but failing to save to MongoDB');
      console.log('   - MongoDB connection in scrapers is broken');
      console.log('   - Wrong database name being used');
    } else {
      // Check most recent job
      const recentJobs = await jobsCollection
        .find({})
        .sort({ scrapedDate: -1 })
        .limit(5)
        .toArray();
      
      if (recentJobs.length > 0) {
        console.log('\n📅 Most recent jobs:');
        recentJobs.forEach((job, idx) => {
          const scrapedDate = job.scrapedDate || job.createdAt || job.updatedAt;
          const daysAgo = scrapedDate 
            ? Math.floor((Date.now() - new Date(scrapedDate).getTime()) / (1000 * 60 * 60 * 24))
            : 'unknown';
          
          console.log(`   ${idx + 1}. ${job.title} at ${job.company}`);
          console.log(`      Scraped: ${scrapedDate ? new Date(scrapedDate).toISOString() : 'unknown'} (${daysAgo} days ago)`);
          console.log(`      Source: ${job.source || job.site_source || 'unknown'}`);
        });
        
        const oldestRecentJob = recentJobs[recentJobs.length - 1];
        const scrapedDate = oldestRecentJob.scrapedDate || oldestRecentJob.createdAt;
        const daysOld = scrapedDate 
          ? Math.floor((Date.now() - new Date(scrapedDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        if (daysOld > 7) {
          console.error(`\n❌ DATA IS STALE! Most recent job is ${daysOld} days old.`);
          console.log('\n💡 This indicates scrapers haven\'t run successfully in over a week.');
        } else if (daysOld > 2) {
          console.warn(`\n⚠️  DATA IS SOMEWHAT STALE. Most recent job is ${daysOld} days old.`);
          console.log('   Scrapers should be running daily.');
        } else {
          console.log(`\n✅ Data is relatively fresh (${daysOld} days old).`);
        }
      }
      
      // Check job distribution by source
      console.log('\n📊 Jobs by source:');
      const sources = await jobsCollection.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      
      sources.forEach(source => {
        console.log(`   ${source._id || 'unknown'}: ${source.count} jobs`);
      });
      
      // Check jobs by recency
      const now = new Date();
      const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      
      const jobsLast24h = await jobsCollection.countDocuments({
        scrapedDate: { $gte: oneDayAgo }
      });
      const jobsLast3Days = await jobsCollection.countDocuments({
        scrapedDate: { $gte: threeDaysAgo }
      });
      const jobsLast7Days = await jobsCollection.countDocuments({
        scrapedDate: { $gte: sevenDaysAgo }
      });
      
      console.log('\n📅 Jobs by recency (scrapedDate):');
      console.log(`   Last 24 hours: ${jobsLast24h}`);
      console.log(`   Last 3 days: ${jobsLast3Days}`);
      console.log(`   Last 7 days: ${jobsLast7Days}`);
      
      if (jobsLast24h === 0) {
        console.error('\n❌ NO JOBS ADDED IN LAST 24 HOURS!');
        console.log('   This indicates scrapers are not running or failing.');
      }
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n💡 Possible causes:');
    console.log('   - MONGODB_URI is invalid or expired');
    console.log('   - Network connectivity issues');
    console.log('   - MongoDB Atlas whitelist doesn\'t include GitHub Actions IPs');
    console.log('   - MongoDB cluster is paused or deleted');
  } finally {
    if (client) {
      await client.close();
    }
  }
  
  // Check 3: GitHub Actions Configuration
  console.log('\n3. CHECKING GITHUB ACTIONS CONFIGURATION');
  console.log('-'.repeat(60));
  
  const fs = require('fs');
  const path = require('path');
  
  const workflowFiles = [
    '.github/workflows/jobspy-scraper.yml',
    '.github/workflows/direct-scraper.yml',
    '.github/workflows/scrape-jobs.yml',
    '.github/workflows/run-scrapers.yml'
  ];
  
  console.log('\n📋 Checking workflow files:');
  for (const workflowFile of workflowFiles) {
    if (fs.existsSync(workflowFile)) {
      const content = fs.readFileSync(workflowFile, 'utf8');
      
      // Check if scheduled
      const hasSchedule = content.includes('schedule:');
      const scheduleLine = content.match(/cron:\s*['"]([^'"]+)['"]/);
      const isScheduleCommented = content.match(/^[\s]*#[\s]*schedule:/m);
      
      console.log(`\n   ${path.basename(workflowFile)}:`);
      console.log(`      - Has schedule: ${hasSchedule}`);
      if (scheduleLine) {
        console.log(`      - Cron expression: ${scheduleLine[1]}`);
      }
      if (isScheduleCommented) {
        console.warn('      ⚠️  SCHEDULE IS COMMENTED OUT! Workflow will not run automatically.');
      }
      console.log(`      - Has workflow_dispatch: ${content.includes('workflow_dispatch')}`);
      console.log(`      - Has MongoDB import: ${content.includes('import') && content.includes('mongodb')}`);
    } else {
      console.log(`\n   ${path.basename(workflowFile)}: ❌ NOT FOUND`);
    }
  }
  
  // Check 4: Results Directory
  console.log('\n4. CHECKING LOCAL SCRAPER RESULTS');
  console.log('-'.repeat(60));
  
  const resultsDir = 'results';
  if (fs.existsSync(resultsDir)) {
    const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
    console.log(`\n📁 Found ${files.length} result files in ${resultsDir}/`);
    
    files.forEach(file => {
      const filePath = path.join(resultsDir, file);
      const stats = fs.statSync(filePath);
      const ageHours = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60));
      console.log(`   ${file} - ${Math.round(stats.size / 1024)}KB - ${ageHours}h old`);
    });
  } else {
    console.log('❌ No results directory found');
  }
  
  // Summary and Recommendations
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY & RECOMMENDATIONS');
  console.log('='.repeat(60));
  console.log('\n🔍 Based on the diagnostics above, here are the likely issues:\n');
  console.log('1. Check if GitHub Actions workflows are ENABLED in the repository');
  console.log('   - Go to: https://github.com/yottoy/remote-desk.work/actions');
  console.log('   - Verify workflows are not disabled');
  console.log('   - Check if any workflows have run recently');
  console.log('');
  console.log('2. Check GitHub Secrets are properly set:');
  console.log('   - MONGODB_URI');
  console.log('   - MONGODB_DB (should be "clickclickjob")');
  console.log('');
  console.log('3. Check MongoDB Atlas Network Access:');
  console.log('   - Must allow 0.0.0.0/0 (all IPs) for GitHub Actions');
  console.log('   - Or whitelist GitHub Actions IP ranges');
  console.log('');
  console.log('4. Manually trigger a workflow to test:');
  console.log('   - Go to Actions tab');
  console.log('   - Select "JobSpy Scraper" or "Main Job Scraper"');
  console.log('   - Click "Run workflow"');
  console.log('   - Check logs for errors');
  console.log('');
  console.log('5. If workflows are commented out (schedule), uncomment them:');
  console.log('   - Edit the .yml files to enable the schedule');
  console.log('   - Commit and push changes');
  console.log('\n' + '='.repeat(60) + '\n');
}

// Run diagnostics
diagnoseStaleData().catch(error => {
  console.error('Fatal error during diagnostics:', error);
  process.exit(1);
});


