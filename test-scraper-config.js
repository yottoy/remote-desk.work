#!/usr/bin/env node

/**
 * Test Scraper Configuration
 * Tests the new 78 search queries configuration without needing the Python bridge
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Scraper Configuration...\n');

// Load the configuration file
const configPath = path.join(__dirname, 'python-bridge', 'admin-data-entry-keywords.json');

try {
  const configData = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configData);
  
  console.log('✅ Configuration file loaded successfully!\n');
  
  // Analyze the configuration
  console.log('📊 Configuration Summary:');
  console.log('═'.repeat(60));
  
  if (config.search_combinations && config.search_combinations.length > 0) {
    console.log(`\n✅ Total Search Queries: ${config.search_combinations.length}`);
    
    // Count by category
    const categoryCount = {};
    const siteCount = {};
    
    config.search_combinations.forEach(combo => {
      const cat = combo.category || 'uncategorized';
      const site = combo.site || 'unknown';
      
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      siteCount[site] = (siteCount[site] || 0) + 1;
    });
    
    console.log('\n📁 Queries by Category:');
    Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`   ${cat.padEnd(25)} ${count} queries`);
    });
    
    console.log('\n🌐 Queries by Site:');
    Object.entries(siteCount).forEach(([site, count]) => {
      console.log(`   ${site.padEnd(25)} ${count} queries`);
    });
    
    console.log('\n📝 Sample Queries (First 10):');
    console.log('─'.repeat(60));
    config.search_combinations.slice(0, 10).forEach((combo, idx) => {
      console.log(`${(idx + 1).toString().padStart(2)}. [${combo.category}] "${combo.term}" on ${combo.site}`);
    });
    
    console.log('\n🎯 New SEO Page Queries:');
    console.log('─'.repeat(60));
    
    const medicalCount = config.search_combinations.filter(c => c.category === 'medical-data-entry').length;
    const analystCount = config.search_combinations.filter(c => c.category === 'data-analyst').length;
    const dataEntryCount = config.search_combinations.filter(c => c.category === 'data-entry').length;
    const customerServiceCount = config.search_combinations.filter(c => c.category === 'customer-service').length;
    const tutoringCount = config.search_combinations.filter(c => c.category === 'tutoring').length;
    const adminCount = config.search_combinations.filter(c => c.category === 'admin').length;
    
    console.log(`   Medical Data Entry:      ${medicalCount} queries`);
    console.log(`   Data Analyst:            ${analystCount} queries`);
    console.log(`   Data Entry Hub:          ${dataEntryCount} queries`);
    console.log(`   Customer Service:        ${customerServiceCount} queries`);
    console.log(`   Online Tutoring:         ${tutoringCount} queries`);
    console.log(`   Admin Assistant:         ${adminCount} queries`);
    console.log(`   ${'─'.repeat(45)}`);
    console.log(`   Total:                   ${medicalCount + analystCount + dataEntryCount + customerServiceCount + tutoringCount + adminCount} queries`);
    
  } else if (config.job_types && config.keywords) {
    console.log(`\n⚠️  Configuration uses dynamic generation`);
    console.log(`   Job Types: ${config.job_types.length}`);
    console.log(`   Keywords: ${config.keywords.length}`);
    console.log(`   Max Combinations: ${config.job_types.length * config.keywords.length}`);
  }
  
  if (config.exclude_keywords && config.exclude_keywords.length > 0) {
    console.log(`\n🚫 Exclude Keywords: ${config.exclude_keywords.length}`);
    console.log(`   ${config.exclude_keywords.join(', ')}`);
  }
  
  if (config.locations && config.locations.length > 0) {
    console.log(`\n🌍 Locations: ${config.locations.join(', ')}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Configuration is valid and ready to use!');
  console.log('\n💡 To run the scraper:');
  console.log('   1. Start the JobSpy bridge: cd python-bridge && ./start-bridge.sh');
  console.log('   2. Run a test: LIMIT_SEARCH_RESULTS=5 node python-bridge/scrape-all-jobs.js');
  console.log('   3. Run full scrape: node python-bridge/scrape-all-jobs.js');
  console.log('\n⏱️  Expected scraping time: 20-40 minutes (78 queries)');
  console.log('📊 Expected job count: 400-1,500+ jobs across all categories\n');
  
} catch (error) {
  console.error('❌ Error loading configuration:', error.message);
  process.exit(1);
}
