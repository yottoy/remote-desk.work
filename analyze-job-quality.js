/**
 * Job Quality Analyzer
 * 
 * This script analyzes your scraped jobs to assess their quality and identify potential issues.
 * It helps evaluate if your filtering is working properly and identifies areas for improvement.
 */

const fs = require('fs');
const path = require('path');

// Configure logger
const logger = {
  info: (...args) => console.log(`INFO: ${args.join(' ')}`),
  warn: (...args) => console.warn(`WARNING: ${args.join(' ')}`),
  error: (...args) => console.error(`ERROR: ${args.join(' ')}`)
};

// Configuration
const COMBINED_RESULTS_FILE = path.join(__dirname, 'combined-results.json');
const KEYWORDS_FILE = path.join(__dirname, 'admin-data-entry-keywords.json');
const MIN_DESCRIPTION_LENGTH = 100;
const QUALITY_REPORT_FILE = path.join(__dirname, 'job-quality-report.json');

// Load jobs from combined results
function loadJobs() {
  try {
    if (!fs.existsSync(COMBINED_RESULTS_FILE)) {
      logger.error(`Combined results file not found: ${COMBINED_RESULTS_FILE}`);
      return [];
    }
    
    const data = fs.readFileSync(COMBINED_RESULTS_FILE, 'utf8');
    const jobs = JSON.parse(data);
    logger.info(`Loaded ${jobs.length} jobs from ${COMBINED_RESULTS_FILE}`);
    return jobs;
  } catch (error) {
    logger.error(`Error loading jobs: ${error.message}`);
    return [];
  }
}

// Load keywords
function loadKeywords() {
  try {
    if (!fs.existsSync(KEYWORDS_FILE)) {
      logger.error(`Keywords file not found: ${KEYWORDS_FILE}`);
      return null;
    }
    
    const data = fs.readFileSync(KEYWORDS_FILE, 'utf8');
    const keywords = JSON.parse(data);
    logger.info(`Loaded keywords configuration with ${keywords.job_types?.length || 0} job types`);
    return keywords;
  } catch (error) {
    logger.error(`Error loading keywords: ${error.message}`);
    return null;
  }
}

// Function to detect scam indicators in job postings
function detectScamIndicators(job) {
  const title = (job.title || '').toLowerCase();
  const description = (job.description || '').toLowerCase();
  const combinedText = `${title} ${description}`;
  
  const scamIndicators = [];
  
  // Check for unrealistic income claims
  if (
    combinedText.includes('earn $') ||
    combinedText.includes('make $') ||
    combinedText.includes('up to $') ||
    combinedText.includes('$$$')
  ) {
    scamIndicators.push('unrealistic_income_claims');
  }
  
  // Check for upfront payment requirement
  if (
    combinedText.includes('certification required') ||
    combinedText.includes('fee required') ||
    combinedText.includes('payment required') ||
    combinedText.includes('registration fee')
  ) {
    scamIndicators.push('upfront_payment');
  }
  
  // Check for vague job descriptions
  if (description.split(/\s+/).length < MIN_DESCRIPTION_LENGTH) {
    scamIndicators.push('vague_description');
  }
  
  // Check for suspicious contact methods
  if (
    combinedText.includes('whatsapp') ||
    combinedText.includes('telegram') ||
    (combinedText.includes('contact') && combinedText.includes('gmail')) ||
    combinedText.includes('text me at')
  ) {
    scamIndicators.push('suspicious_contact_methods');
  }
  
  // Check for keywords that often appear in scams
  const scamKeywords = [
    'mlm', 'multi-level', 'quick money', 'easy money', 'fast money',
    'get rich', 'be your own boss', 'no experience needed', 'work in your pajamas'
  ];
  
  for (const keyword of scamKeywords) {
    if (combinedText.includes(keyword)) {
      scamIndicators.push(`scam_keyword:${keyword}`);
      break;
    }
  }
  
  return scamIndicators;
}

// Calculate relevance score for job
function calculateRelevanceScore(job, keywords) {
  if (!job || !keywords) return 0;
  
  const title = (job.title || '').toLowerCase();
  const description = (job.description || '').toLowerCase();
  const combinedText = `${title} ${description}`;
  
  let score = 0;
  const maxScore = 10;
  
  // Check job type matches in title (0-5 points)
  let jobTypeMatches = 0;
  for (const jobType of keywords.job_types || []) {
    if (title.includes(jobType.toLowerCase())) {
      jobTypeMatches++;
    }
  }
  score += Math.min(jobTypeMatches * 2, 5);
  
  // Check general keywords (0-2 points)
  let keywordMatches = 0;
  for (const keyword of keywords.keywords || []) {
    if (combinedText.includes(keyword.toLowerCase())) {
      keywordMatches++;
    }
  }
  score += Math.min(keywordMatches, 2);
  
  // Check required keywords (0-3 points)
  let requiredMatches = 0;
  for (const keyword of keywords.required_keywords || []) {
    if (combinedText.includes(keyword.toLowerCase())) {
      requiredMatches++;
    }
  }
  score += Math.min(requiredMatches, 3);
  
  return score;
}

// Main analysis function
function analyzeJobs() {
  // Load jobs and keywords
  const jobs = loadJobs();
  const keywords = loadKeywords();
  
  if (!jobs.length || !keywords) {
    logger.error('Cannot analyze jobs without data and keywords');
    return;
  }
  
  // Analysis results
  const results = {
    totalJobs: jobs.length,
    siteDistribution: {},
    sourceFileDistribution: {},
    qualityMetrics: {
      highQuality: 0,
      mediumQuality: 0,
      lowQuality: 0,
      potentialScams: 0
    },
    jobTypeDistribution: {},
    scamIndicatorsDistribution: {},
    averageRelevanceScore: 0,
    potentiallyMisclassifiedJobs: [],
    detailedAnalysis: []
  };
  
  // Track total scores for average calculation
  let totalScore = 0;
  
  // Analyze each job
  for (const job of jobs) {
    const site = job.site_source || job.source || 'unknown';
    const sourceFile = job.source_file || 'unknown';
    
    // Count by site
    results.siteDistribution[site] = (results.siteDistribution[site] || 0) + 1;
    
    // Count by source file
    results.sourceFileDistribution[sourceFile] = (results.sourceFileDistribution[sourceFile] || 0) + 1;
    
    // Calculate relevance score
    const relevanceScore = calculateRelevanceScore(job, keywords);
    totalScore += relevanceScore;
    
    // Detect scam indicators
    const scamIndicators = detectScamIndicators(job);
    
    // Categorize job quality
    let qualityCategory = '';
    if (scamIndicators.length > 0) {
      qualityCategory = 'potential_scam';
      results.qualityMetrics.potentialScams++;
    } else if (relevanceScore >= 7) {
      qualityCategory = 'high_quality';
      results.qualityMetrics.highQuality++;
    } else if (relevanceScore >= 4) {
      qualityCategory = 'medium_quality';
      results.qualityMetrics.mediumQuality++;
    } else {
      qualityCategory = 'low_quality';
      results.qualityMetrics.lowQuality++;
    }
    
    // Count by job type
    const title = (job.title || '').toLowerCase();
    let jobTypeFound = false;
    
    for (const jobType of keywords.job_types || []) {
      if (title.includes(jobType.toLowerCase())) {
        results.jobTypeDistribution[jobType] = (results.jobTypeDistribution[jobType] || 0) + 1;
        jobTypeFound = true;
        break;
      }
    }
    
    if (!jobTypeFound) {
      results.jobTypeDistribution['unknown'] = (results.jobTypeDistribution['unknown'] || 0) + 1;
    }
    
    // Count scam indicators
    for (const indicator of scamIndicators) {
      results.scamIndicatorsDistribution[indicator] = (results.scamIndicatorsDistribution[indicator] || 0) + 1;
    }
    
    // Identify potentially misclassified jobs
    if (
      (qualityCategory === 'low_quality' && job.is_validated === true) ||
      (relevanceScore < 4 && job.is_validated === true) ||
      (scamIndicators.length > 0 && job.is_validated === true)
    ) {
      results.potentiallyMisclassifiedJobs.push({
        title: job.title,
        company: job.company,
        site: site,
        relevanceScore: relevanceScore,
        scamIndicators: scamIndicators,
        qualityCategory: qualityCategory,
        isValidated: job.is_validated
      });
    }
    
    // Add to detailed analysis
    results.detailedAnalysis.push({
      title: job.title,
      company: job.company,
      site: site,
      relevanceScore: relevanceScore,
      scamIndicators: scamIndicators,
      qualityCategory: qualityCategory
    });
  }
  
  // Calculate average relevance score
  results.averageRelevanceScore = totalScore / jobs.length;
  
  // Output summary
  logger.info('=== Job Quality Analysis Results ===');
  logger.info(`Total jobs: ${results.totalJobs}`);
  logger.info(`Average relevance score: ${results.averageRelevanceScore.toFixed(2)}/10`);
  logger.info('Quality distribution:');
  logger.info(`  High quality: ${results.qualityMetrics.highQuality} jobs (${(results.qualityMetrics.highQuality/results.totalJobs*100).toFixed(1)}%)`);
  logger.info(`  Medium quality: ${results.qualityMetrics.mediumQuality} jobs (${(results.qualityMetrics.mediumQuality/results.totalJobs*100).toFixed(1)}%)`);
  logger.info(`  Low quality: ${results.qualityMetrics.lowQuality} jobs (${(results.qualityMetrics.lowQuality/results.totalJobs*100).toFixed(1)}%)`);
  logger.info(`  Potential scams: ${results.qualityMetrics.potentialScams} jobs (${(results.qualityMetrics.potentialScams/results.totalJobs*100).toFixed(1)}%)`);
  
  logger.info(`Potentially misclassified jobs: ${results.potentiallyMisclassifiedJobs.length}`);
  
  // Most common job types
  logger.info('Most common job types:');
  Object.entries(results.jobTypeDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([jobType, count]) => {
      logger.info(`  ${jobType}: ${count} jobs (${(count/results.totalJobs*100).toFixed(1)}%)`);
    });
  
  // Sites with highest potential scam rate
  logger.info('Scam indicators:');
  Object.entries(results.scamIndicatorsDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([indicator, count]) => {
      logger.info(`  ${indicator}: ${count} jobs (${(count/results.totalJobs*100).toFixed(1)}%)`);
    });
  
  // Save detailed report to file
  fs.writeFileSync(QUALITY_REPORT_FILE, JSON.stringify(results, null, 2));
  logger.info(`Detailed report saved to ${QUALITY_REPORT_FILE}`);
  
  return results;
}

// Run the analysis
analyzeJobs(); 