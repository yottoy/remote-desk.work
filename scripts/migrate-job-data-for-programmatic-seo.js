/**
 * Database Migration Script for Programmatic SEO
 * 
 * This script normalizes job data to ensure all jobs have the proper fields
 * for filtering in programmatic SEO pages:
 * - jobCategory (data-entry, virtual-assistant, etc.)
 * - experienceLevel (entry-level, no-experience, etc.)
 * - jobType (full-time, part-time, contract)
 * - location_restriction (state-specific)
 */

const { MongoClient } = require('mongodb');
const path = require('path');

// Load environment variables from frontend/.env.local
require('dotenv').config({ path: path.join(__dirname, '../frontend/.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

// Category mapping based on job titles and keywords
const CATEGORY_KEYWORDS = {
  'data-entry': [
    'data entry',
    'data input',
    'data processor',
    'data clerk',
    'typist',
    'data operator'
  ],
  'virtual-assistant': [
    'virtual assistant',
    'virtual admin',
    'remote assistant',
    'va ',
    'online assistant',
    'executive assistant'
  ],
  'customer-service': [
    'customer service',
    'customer support',
    'customer care',
    'help desk',
    'support specialist',
    'customer success'
  ],
  'transcription': [
    'transcription',
    'transcriber',
    'transcriptionist',
    'medical transcription',
    'legal transcription',
    'audio transcription'
  ],
  'bookkeeping': [
    'bookkeeping',
    'bookkeeper',
    'accounting clerk',
    'accounts',
    'quickbooks',
    'accounts payable'
  ]
};

// Experience level detection
const EXPERIENCE_PATTERNS = {
  'entry-level': [
    'entry level',
    'entry-level',
    '0-1 year',
    '0-2 year',
    'junior',
    'beginner'
  ],
  'no-experience': [
    'no experience',
    'no experience required',
    'no experience necessary',
    'experience not required'
  ],
  'for-beginners': [
    'for beginners',
    'beginner-friendly',
    'beginners welcome'
  ]
};

// Job type detection
const JOB_TYPE_PATTERNS = {
  'part-time': ['part time', 'part-time', 'pt ', 'parttime'],
  'full-time': ['full time', 'full-time', 'ft ', 'fulltime'],
  'contract': ['contract', 'contractor', 'freelance', 'temporary', 'temp']
};

// US State patterns
const US_STATES = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY'
};

// Priority states for programmatic SEO
const PRIORITY_STATES = [
  'texas', 'california', 'florida', 'new york', 'georgia',
  'north carolina', 'pennsylvania', 'ohio', 'illinois', 'michigan',
  'arizona', 'colorado', 'virginia', 'washington', 'tennessee'
];

/**
 * Detect job category from title and description
 */
function detectCategory(title, description) {
  const searchText = `${title} ${description}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        return category;
      }
    }
  }
  
  return null;
}

/**
 * Detect experience level from title and description
 */
function detectExperienceLevel(title, description) {
  const searchText = `${title} ${description}`.toLowerCase();
  
  for (const [level, patterns] of Object.entries(EXPERIENCE_PATTERNS)) {
    for (const pattern of patterns) {
      if (searchText.includes(pattern)) {
        return level;
      }
    }
  }
  
  return null;
}

/**
 * Detect job type from title and description
 */
function detectJobType(title, description, existingJobType) {
  // If already has a job type, use it
  if (existingJobType && ['part-time', 'full-time', 'contract'].includes(existingJobType.toLowerCase())) {
    return existingJobType.toLowerCase();
  }
  
  const searchText = `${title} ${description}`.toLowerCase();
  
  for (const [type, patterns] of Object.entries(JOB_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (searchText.includes(pattern)) {
        return type;
      }
    }
  }
  
  // Default to full-time if not specified
  return 'full-time';
}

/**
 * Detect US states from location field
 */
function detectStates(location) {
  if (!location) return [];
  
  const locationLower = location.toLowerCase();
  const detectedStates = [];
  
  // Check for state names and abbreviations
  for (const [stateName, abbr] of Object.entries(US_STATES)) {
    if (locationLower.includes(stateName) || 
        locationLower.includes(abbr.toLowerCase()) ||
        locationLower.includes(`, ${abbr.toLowerCase()}`) ||
        locationLower.includes(`-${abbr.toLowerCase()}`)) {
      // Only add priority states for our programmatic SEO
      if (PRIORITY_STATES.includes(stateName)) {
        detectedStates.push(stateName);
      }
    }
  }
  
  // If "remote" or "anywhere" is mentioned without specific state, return empty
  if (locationLower.includes('remote') && detectedStates.length === 0) {
    return ['us-nationwide'];
  }
  
  return detectedStates;
}

/**
 * Main migration function
 */
async function migrateJobs() {
  console.log('Starting job data migration for programmatic SEO...\n');
  
  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db();
    const jobsCollection = db.collection('jobs');

    // Get total count
    const totalJobs = await jobsCollection.countDocuments();
    console.log(`Found ${totalJobs} total jobs in database\n`);

    // Find jobs that need updating (missing key fields)
    const jobsToUpdate = await jobsCollection.find({
      $or: [
        { jobCategory: { $exists: false } },
        { jobCategory: null },
        { experienceLevel: { $exists: false } },
        { jobType: { $exists: false } },
        { location_restriction: { $exists: false } }
      ]
    }).toArray();

    console.log(`Found ${jobsToUpdate.length} jobs that need updating\n`);

    let updated = 0;
    let skipped = 0;
    const categoryStats = {};
    const experienceStats = {};
    const stateStats = {};

    for (const job of jobsToUpdate) {
      const updates = {};
      
      // Detect and set category
      if (!job.jobCategory) {
        const category = detectCategory(
          job.title || '',
          job.description || job.descriptionText || ''
        );
        if (category) {
          updates.jobCategory = category;
          categoryStats[category] = (categoryStats[category] || 0) + 1;
        }
      }

      // Detect and set experience level
      if (!job.experienceLevel) {
        const experience = detectExperienceLevel(
          job.title || '',
          job.description || job.descriptionText || ''
        );
        if (experience) {
          updates.experienceLevel = experience;
          experienceStats[experience] = (experienceStats[experience] || 0) + 1;
        }
      }

      // Detect and set job type
      if (!job.jobType) {
        const jobType = detectJobType(
          job.title || '',
          job.description || job.descriptionText || '',
          job.jobType
        );
        updates.jobType = jobType;
      }

      // Detect and set location restriction
      if (!job.location_restriction) {
        const states = detectStates(job.location || '');
        if (states.length > 0) {
          updates.location_restriction = states.join(', ');
          states.forEach(state => {
            stateStats[state] = (stateStats[state] || 0) + 1;
          });
        }
      }

      // Update the job if we have changes
      if (Object.keys(updates).length > 0) {
        await jobsCollection.updateOne(
          { _id: job._id },
          { 
            $set: {
              ...updates,
              updatedAt: new Date()
            }
          }
        );
        updated++;
        
        if (updated % 100 === 0) {
          console.log(`Progress: ${updated}/${jobsToUpdate.length} jobs updated...`);
        }
      } else {
        skipped++;
      }
    }

    console.log('\n========================================');
    console.log('MIGRATION COMPLETE');
    console.log('========================================\n');
    console.log(`Total jobs processed: ${jobsToUpdate.length}`);
    console.log(`Jobs updated: ${updated}`);
    console.log(`Jobs skipped: ${skipped}\n`);

    console.log('Category Distribution:');
    Object.entries(categoryStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} jobs`);
      });

    console.log('\nExperience Level Distribution:');
    Object.entries(experienceStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([level, count]) => {
        console.log(`  ${level}: ${count} jobs`);
      });

    console.log('\nTop States by Job Count:');
    Object.entries(stateStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([state, count]) => {
        console.log(`  ${state}: ${count} jobs`);
      });

    console.log('\n========================================');
    console.log('RECOMMENDATIONS');
    console.log('========================================\n');

    // Calculate coverage
    const categoryCoverage = (Object.values(categoryStats).reduce((a, b) => a + b, 0) / jobsToUpdate.length * 100).toFixed(1);
    const experienceCoverage = (Object.values(experienceStats).reduce((a, b) => a + b, 0) / jobsToUpdate.length * 100).toFixed(1);
    const stateCoverage = (Object.values(stateStats).reduce((a, b) => a + b, 0) / jobsToUpdate.length * 100).toFixed(1);

    console.log(`Category Detection: ${categoryCoverage}% coverage`);
    if (parseFloat(categoryCoverage) < 80) {
      console.log('  ⚠️  Consider expanding category keyword patterns');
    } else {
      console.log('  ✓ Good coverage');
    }

    console.log(`\nExperience Level Detection: ${experienceCoverage}% coverage`);
    if (parseFloat(experienceCoverage) < 50) {
      console.log('  ⚠️  Low coverage - this is expected, many jobs don\'t specify experience');
    } else {
      console.log('  ✓ Acceptable coverage');
    }

    console.log(`\nState Detection: ${stateCoverage}% coverage`);
    if (parseFloat(stateCoverage) < 70) {
      console.log('  ⚠️  Consider improving location parsing');
    } else {
      console.log('  ✓ Good coverage');
    }

    console.log('\n✓ Migration complete! Your jobs are now optimized for programmatic SEO pages.\n');

  } catch (error) {
    console.error('ERROR during migration:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run migration
if (require.main === module) {
  migrateJobs().catch(console.error);
}

module.exports = { migrateJobs, detectCategory, detectExperienceLevel, detectJobType, detectStates };
