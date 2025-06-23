/**
 * Production Posting Date Validation Script
 * 
 * This script validates that job posting dates are working correctly in production
 * by testing the live API endpoint.
 */

const https = require('https');

// Production API endpoint
const PRODUCTION_API = 'https://clickclickjob-2i9z1tlo6-yottoys-projects.vercel.app/api/jobs?limit=20';

async function fetchProductionJobs() {
  return new Promise((resolve, reject) => {
    https.get(PRODUCTION_API, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error('Failed to parse JSON response'));
        }
      });
    }).on('error', reject);
  });
}

async function validateProductionPostingDates() {
  console.log('🔍 Validating production job posting dates...\n');
  
  try {
    const response = await fetchProductionJobs();
    const jobs = response.jobs || [];
    
    if (jobs.length === 0) {
      console.log('❌ No jobs returned from production API');
      return;
    }
    
    console.log(`📊 Analyzing ${jobs.length} jobs from production API:\n`);
    
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
    console.log('📈 Production API Analysis Results:');
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
    
    // Show sample job posting dates with time ago calculation
    console.log('\n   Sample job posting dates:');
    jobs.slice(0, 5).forEach((job, index) => {
      const postedDate = new Date(job.postedDate);
      const timeAgo = Math.floor((now - postedDate) / (1000 * 60 * 60 * 24));
      console.log(`   ${index + 1}. ${job.title?.substring(0, 30)}... - ${timeAgo} days ago`);
    });
    
    // Overall assessment
    console.log('\n🎯 Overall Assessment:');
    if (analysis.uniqueDates.size > 1 && analysis.currentDateIssues < analysis.totalJobs * 0.5) {
      console.log('   ✅ SUCCESS: Production posting dates are working correctly!');
      console.log('   ✅ Jobs show realistic posting times instead of "1 minute ago"');
      console.log('   ✅ Fix has been successfully deployed and is working');
    } else {
      console.log('   ❌ There may still be issues with posting date display');
    }
    
    console.log('\n✨ Production validation complete!');
    
  } catch (error) {
    console.error('❌ Error during production validation:', error.message);
  }
}

// Run the validation
if (require.main === module) {
  validateProductionPostingDates().catch(console.error);
}

module.exports = { validateProductionPostingDates }; 