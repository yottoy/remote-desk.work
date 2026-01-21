#!/usr/bin/env node

/**
 * Verify Structured Data on Job Pages
 * 
 * This script checks if job pages have proper schema.org JobPosting markup
 * to ensure Google can properly index and display job postings.
 */

const https = require('https');

const BASE_URL = 'https://www.clickclickjob.com';

// Sample job pages to test
const testPages = [
  '/jobs',
  '/customer-service-work-from-home-jobs',
  '/remote-data-entry-jobs',
  '/remote-administrative-assistant-jobs'
];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    }).on('error', reject);
  });
}

function validateJobSchema(html, url) {
  const issues = [];
  
  // Check for JobPosting schema
  const hasJobPosting = html.includes('"@type":"JobPosting"') || 
                        html.includes('"@type": "JobPosting"');
  
  if (!hasJobPosting && url.includes('/jobs/')) {
    issues.push('❌ Missing JobPosting schema markup');
  }
  
  // Check for required fields
  const requiredFields = [
    { field: 'title', pattern: /"title":\s*"[^"]+"/ },
    { field: 'description', pattern: /"description":\s*"[^"]+"/ },
    { field: 'datePosted', pattern: /"datePosted":\s*"[^"]+"/ },
    { field: 'hiringOrganization', pattern: /"hiringOrganization":\s*{/ },
    { field: 'jobLocation', pattern: /"jobLocation":\s*{/ }
  ];
  
  requiredFields.forEach(({ field, pattern }) => {
    if (hasJobPosting && !pattern.test(html)) {
      issues.push(`⚠️  Missing required field: ${field}`);
    }
  });
  
  // Check for recommended fields
  const recommendedFields = [
    { field: 'employmentType', pattern: /"employmentType":\s*"[^"]+"/ },
    { field: 'validThrough', pattern: /"validThrough":\s*"[^"]+"/ },
    { field: 'baseSalary', pattern: /"baseSalary":\s*{/ }
  ];
  
  recommendedFields.forEach(({ field, pattern }) => {
    if (hasJobPosting && !pattern.test(html)) {
      issues.push(`💡 Missing recommended field: ${field}`);
    }
  });
  
  return {
    hasSchema: hasJobPosting,
    issues
  };
}

async function main() {
  console.log('🔍 Verifying Structured Data on Job Pages');
  console.log('==========================================\n');
  
  for (const page of testPages) {
    const url = `${BASE_URL}${page}`;
    console.log(`\n📄 Testing: ${url}`);
    
    try {
      const { statusCode, data } = await fetchPage(url);
      
      if (statusCode !== 200) {
        console.log(`   ❌ HTTP ${statusCode} - Page not accessible`);
        continue;
      }
      
      console.log(`   ✅ HTTP ${statusCode} - Page accessible`);
      
      const validation = validateJobSchema(data, url);
      
      if (validation.hasSchema) {
        console.log('   ✅ JobPosting schema found');
      } else if (page.includes('/jobs/')) {
        console.log('   ❌ JobPosting schema missing');
      } else {
        console.log('   ℹ️  Not a job detail page (schema optional)');
      }
      
      if (validation.issues.length > 0) {
        console.log('\n   Issues found:');
        validation.issues.forEach(issue => console.log(`   ${issue}`));
      } else if (validation.hasSchema) {
        console.log('   ✅ All required fields present');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n\n📊 Summary');
  console.log('==========');
  console.log('✅ Structured data validation complete');
  console.log('💡 If any issues were found, they should be fixed in the frontend code');
  console.log('📋 After fixes, submit URLs to Google Search Console for re-indexing');
  console.log('\n');
}

main().catch(console.error);
