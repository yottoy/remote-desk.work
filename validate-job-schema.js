/**
 * Job Schema Validation Script
 * 
 * This script validates JobPosting schema markup for Google for Jobs compliance.
 * Run: node validate-job-schema.js
 */

const { connectToDatabase } = require('./frontend/utils/mongodb');

// Required fields per Google's documentation
const REQUIRED_FIELDS = [
  'title',
  'description',
  'datePosted',
  'validThrough',
  'hiringOrganization',
];

// Strongly recommended fields
const RECOMMENDED_FIELDS = [
  'baseSalary',
  'employmentType',
  'jobLocation',
  'applicationContact',
];

/**
 * Validates a single job schema
 */
function validateJobSchema(schema, jobId) {
  const errors = [];
  const warnings = [];

  // Check required fields
  REQUIRED_FIELDS.forEach(field => {
    if (!schema[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate title
  if (schema.title && schema.title.length < 3) {
    errors.push('Title is too short (minimum 3 characters)');
  }

  // Validate description (minimum 200 characters)
  if (schema.description) {
    const cleanDesc = schema.description.replace(/<[^>]+>/g, '').trim();
    if (cleanDesc.length < 200) {
      errors.push(`Description too short: ${cleanDesc.length} characters (minimum 200 required)`);
    }
    if (cleanDesc.length > 10000) {
      warnings.push(`Description very long: ${cleanDesc.length} characters (recommended under 10,000)`);
    }
  }

  // Validate datePosted format (ISO 8601)
  if (schema.datePosted) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (!dateRegex.test(schema.datePosted)) {
      errors.push(`Invalid datePosted format: ${schema.datePosted} (must be ISO 8601)`);
    }

    // Check if date is in the past (not future)
    const postedDate = new Date(schema.datePosted);
    if (postedDate > new Date()) {
      errors.push('datePosted cannot be in the future');
    }
  }

  // Validate validThrough (must be in the future)
  if (schema.validThrough) {
    const validDate = new Date(schema.validThrough);
    const now = new Date();
    
    if (validDate <= now) {
      errors.push(`validThrough date has passed: ${schema.validThrough}`);
    }

    // Check if validThrough is too far in the future (>6 months is suspicious)
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    if (validDate > sixMonthsFromNow) {
      warnings.push(`validThrough is very far in future: ${schema.validThrough}`);
    }
  }

  // Validate employmentType (must be array)
  if (schema.employmentType) {
    if (!Array.isArray(schema.employmentType)) {
      errors.push('employmentType must be an array');
    } else {
      const validTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY', 'INTERN', 'VOLUNTEER', 'PER_DIEM', 'OTHER'];
      schema.employmentType.forEach(type => {
        if (!validTypes.includes(type)) {
          errors.push(`Invalid employmentType value: ${type}`);
        }
      });
    }
  }

  // Validate hiringOrganization
  if (schema.hiringOrganization) {
    if (schema.hiringOrganization['@type'] !== 'Organization') {
      errors.push('hiringOrganization @type must be "Organization"');
    }
    if (!schema.hiringOrganization.name) {
      errors.push('hiringOrganization must have a name');
    }
  }

  // Validate baseSalary structure if present
  if (schema.baseSalary) {
    if (schema.baseSalary['@type'] !== 'MonetaryAmount') {
      errors.push('baseSalary @type must be "MonetaryAmount"');
    }
    if (!schema.baseSalary.currency) {
      errors.push('baseSalary must include currency');
    }
    if (!schema.baseSalary.value) {
      errors.push('baseSalary must include value');
    } else if (schema.baseSalary.value['@type'] !== 'QuantitativeValue') {
      errors.push('baseSalary.value @type must be "QuantitativeValue"');
    }
  }

  // Check for recommended fields
  RECOMMENDED_FIELDS.forEach(field => {
    if (!schema[field]) {
      warnings.push(`Missing recommended field: ${field}`);
    }
  });

  // Validate remote job handling
  if (schema.jobLocationType === 'TELECOMMUTE') {
    if (!schema.applicantLocationRequirements) {
      warnings.push('Remote jobs should include applicantLocationRequirements');
    }
  }

  return { errors, warnings };
}

/**
 * Main validation function
 */
async function validateAllJobs() {
  console.log('🔍 Starting Job Schema Validation...\n');

  try {
    const { db } = await connectToDatabase();
    
    if (!db) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Get all active jobs
    const jobs = await db.collection('jobs')
      .find({})
      .limit(100) // Test first 100 jobs
      .toArray();

    console.log(`📊 Found ${jobs.length} jobs to validate\n`);

    let totalErrors = 0;
    let totalWarnings = 0;
    let validJobs = 0;
    const problemJobs = [];

    // Import schema generator
    const { generateJobPostingSchema } = require('./frontend/utils/schemaGenerator');

    for (const job of jobs) {
      // Prepare job data
      const jobData = {
        _id: job._id.toString(),
        title: job.title,
        company: job.company,
        location: job.location || 'Remote',
        description: job.descriptionText || job.description || '',
        salary: job.salary,
        postedDate: job.postedDate ? new Date(job.postedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        url: job.url,
        employmentType: job.jobType,
        experienceLevel: job.experienceLevel,
        benefits: ['Remote work', 'Flexible schedule']
      };

      // Generate schema
      const schema = generateJobPostingSchema(jobData);

      // Validate schema
      const { errors, warnings } = validateJobSchema(schema, job._id);

      if (errors.length === 0 && warnings.length === 0) {
        validJobs++;
      } else if (errors.length > 0) {
        problemJobs.push({
          jobId: job._id,
          title: job.title,
          errors,
          warnings
        });
      }

      totalErrors += errors.length;
      totalWarnings += warnings.length;
    }

    // Print summary
    console.log('═══════════════════════════════════════════════════');
    console.log('📈 VALIDATION SUMMARY');
    console.log('═══════════════════════════════════════════════════\n');
    console.log(`✅ Valid jobs: ${validJobs}/${jobs.length}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    console.log(`⚠️  Total warnings: ${totalWarnings}\n`);

    // Print problem jobs
    if (problemJobs.length > 0) {
      console.log('═══════════════════════════════════════════════════');
      console.log('⚠️  JOBS WITH ISSUES');
      console.log('═══════════════════════════════════════════════════\n');

      problemJobs.slice(0, 10).forEach(({ jobId, title, errors, warnings }) => {
        console.log(`Job: ${title} (ID: ${jobId})`);
        if (errors.length > 0) {
          console.log('  ❌ Errors:');
          errors.forEach(err => console.log(`     - ${err}`));
        }
        if (warnings.length > 0) {
          console.log('  ⚠️  Warnings:');
          warnings.forEach(warn => console.log(`     - ${warn}`));
        }
        console.log();
      });

      if (problemJobs.length > 10) {
        console.log(`... and ${problemJobs.length - 10} more jobs with issues\n`);
      }
    }

    // Print recommendations
    console.log('═══════════════════════════════════════════════════');
    console.log('💡 RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════\n');

    if (totalErrors > 0) {
      console.log('❌ CRITICAL: Fix all errors before submitting to Google for Jobs');
      console.log('   Errors will prevent your jobs from appearing in search results.\n');
    }

    if (totalWarnings > 0) {
      console.log('⚠️  Address warnings to improve visibility in Google for Jobs');
      console.log('   Missing recommended fields (especially salary) reduce CTR.\n');
    }

    if (validJobs === jobs.length) {
      console.log('🎉 EXCELLENT: All jobs have valid schema markup!');
      console.log('   Next steps:');
      console.log('   1. Test individual URLs at: https://search.google.com/test/rich-results');
      console.log('   2. Submit sitemap to Google Search Console');
      console.log('   3. Monitor "Job postings" report in GSC after 7-14 days\n');
    }

    console.log('═══════════════════════════════════════════════════\n');

    process.exit(totalErrors > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Validation error:', error);
    process.exit(1);
  }
}

// Run validation
if (require.main === module) {
  validateAllJobs();
}

module.exports = { validateJobSchema };
