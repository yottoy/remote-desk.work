/**
 * Posting Date Validation Script
 * 
 * This script validates that job posting dates are being preserved correctly
 * throughout the data pipeline from database to API to frontend.
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function validatePostingDates() {
  console.log('🔍 Validating job posting dates...\n');
  
  let client;
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MongoDB URI not provided in environment variables');
    }
    
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(process.env.MONGODB_DB || 'clickclickjob');
    const collection = db.collection('jobs');
    
    // Get sample of jobs from database
    const sampleSize = 50;
    const jobs = await collection.find({}).limit(sampleSize).toArray();
    
    console.log(`📊 Analyzing ${jobs.length} jobs from database:\n`);
    
    // Analyze posting dates
    const analysis = {
      totalJobs: jobs.length,
      withPostedDate: 0,
      uniqueDates: new Set(),
      dateDistribution: {},
      currentDateIssues: 0,
      oldestJob: null,
      newestJob: null
    };
    
    const now = new Date();
    const currentDateThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    jobs.forEach(job => {
      if (job.postedDate) {
        analysis.withPostedDate++;
        
        const postedDate = new Date(job.postedDate);
        const dateKey = postedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Track unique dates
        analysis.uniqueDates.add(dateKey);
        
        // Count jobs per date
        analysis.dateDistribution[dateKey] = (analysis.dateDistribution[dateKey] || 0) + 1;
        
        // Check if job appears to be posted "just now" (potential current date override)
        const timeDiff = Math.abs(now.getTime() - postedDate.getTime());
        if (timeDiff < currentDateThreshold) {
          analysis.currentDateIssues++;
        }
        
        // Track oldest and newest jobs
        if (!analysis.oldestJob || postedDate < new Date(analysis.oldestJob.postedDate)) {
          analysis.oldestJob = job;
        }
        if (!analysis.newestJob || postedDate > new Date(analysis.newestJob.postedDate)) {
          analysis.newestJob = job;
        }
      }
    });
    
    // Print analysis results
    console.log('📈 Database Analysis Results:');
    console.log(`   Jobs with posting dates: ${analysis.withPostedDate}/${analysis.totalJobs}`);
    console.log(`   Unique posting dates: ${analysis.uniqueDates.size}`);
    console.log(`   Date range: ${analysis.oldestJob ? new Date(analysis.oldestJob.postedDate).toLocaleDateString() : 'N/A'} to ${analysis.newestJob ? new Date(analysis.newestJob.postedDate).toLocaleDateString() : 'N/A'}`);
    
    // Check for potential issues
    console.log('\n🚨 Issue Detection:');
    
    if (analysis.uniqueDates.size === 1 && analysis.totalJobs > 5) {
      console.log('   ❌ ISSUE: All jobs have the same posting date - possible override detected');
    } else if (analysis.uniqueDates.size > 1) {
      console.log('   ✅ GOOD: Jobs have varied posting dates');
    }
    
    if (analysis.currentDateIssues > analysis.totalJobs * 0.8) {
      console.log(`   ❌ ISSUE: ${analysis.currentDateIssues} jobs appear to be posted within last 5 minutes - possible current date override`);
    } else {
      console.log(`   ✅ GOOD: Only ${analysis.currentDateIssues} jobs appear recently posted (expected for fresh jobs)`);
    }
    
    // Show date distribution
    console.log('\n📅 Date Distribution (recent dates):');
    const sortedDates = Object.entries(analysis.dateDistribution)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10);
    
    sortedDates.forEach(([date, count]) => {
      console.log(`   ${date}: ${count} jobs`);
    });
    
    // Test API endpoint
    console.log('\n🔗 Testing API endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/jobs?limit=10');
      if (response.ok) {
        const apiData = await response.json();
        const apiJobs = apiData.jobs || [];
        
        console.log(`   ✅ API returned ${apiJobs.length} jobs`);
        
        // Check if API is preserving different posting dates
        const apiUniqueDates = new Set(apiJobs.map(job => 
          job.postedDate ? new Date(job.postedDate).toISOString().split('T')[0] : null
        ).filter(Boolean));
        
        console.log(`   📊 API jobs have ${apiUniqueDates.size} unique posting dates`);
        
        if (apiUniqueDates.size === 1 && apiJobs.length > 1) {
          console.log('   ❌ ISSUE: API is returning jobs with identical posting dates');
        } else if (apiUniqueDates.size > 1) {
          console.log('   ✅ GOOD: API preserves varied posting dates');
        }
        
        // Show sample API posting dates
        console.log('\n   Sample API posting dates:');
        apiJobs.slice(0, 5).forEach((job, index) => {
          const postedDate = new Date(job.postedDate);
          const timeAgo = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));
          console.log(`   ${index + 1}. ${job.title?.substring(0, 30)}... - ${timeAgo} days ago`);
        });
      } else {
        console.log(`   ❌ API request failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Could not test API endpoint: ${error.message}`);
      console.log('   ℹ️  Make sure the frontend is running on localhost:3000');
    }
    
    console.log('\n✨ Validation complete!');
    
  } catch (error) {
    console.error('❌ Error during validation:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Helper function to make HTTP requests (Node.js doesn't have fetch by default in older versions)
async function fetch(url) {
  const https = require('https');
  const http = require('http');
  const urlModule = require('url');
  
  return new Promise((resolve, reject) => {
    const parsedUrl = urlModule.parse(url);
    const lib = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = lib.request(parsedUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: async () => JSON.parse(data)
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Run the validation
if (require.main === module) {
  validatePostingDates().catch(console.error);
}

module.exports = { validatePostingDates }; 