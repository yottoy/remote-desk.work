// Migration script to move jobs from test.jobs to clickclickjob.jobs
// Run with: node migrate-jobs.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function migrateJobData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MongoDB URI not provided in environment variables.');
    return;
  }

  let client;
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    
    // Connect to source and target collections
    const testDb = client.db('test');
    const clickclickjobDb = client.db('clickclickjob');
    
    const sourceCollection = testDb.collection('jobs');
    const targetCollection = clickclickjobDb.collection('jobs');
    
    // Get counts before migration
    const sourceCount = await sourceCollection.countDocuments();
    const targetCountBefore = await targetCollection.countDocuments();
    
    console.log(`Source collection (test.jobs): ${sourceCount} documents`);
    console.log(`Target collection (clickclickjob.jobs) before migration: ${targetCountBefore} documents`);
    
    // Check if we actually have data to migrate
    if (sourceCount === 0) {
      console.log('No documents in source collection to migrate.');
      return;
    }
    
    // Create a backup of the target collection before making changes
    console.log('Creating backup of target collection...');
    const backupCollection = clickclickjobDb.collection('jobs_backup_' + new Date().toISOString().replace(/[:.]/g, '_'));
    const backupDocs = await targetCollection.find({}).toArray();
    if (backupDocs.length > 0) {
      await backupCollection.insertMany(backupDocs);
      console.log(`Backup created: ${backupDocs.length} documents saved to ${backupCollection.collectionName}`);
    } else {
      console.log('No documents in target collection to backup.');
    }
    
    // Process all documents from source and insert into target with transformed schema
    console.log('Starting migration...');
    let processedCount = 0;
    let batchSize = 100;
    let cursor = sourceCollection.find({});
    
    let batch = [];
    await cursor.forEach(doc => {
      // Transform document to match target schema
      const transformedDoc = {
        title: doc.title || 'Untitled Position',
        company: doc.company || 'Unknown Company',
        description: doc.description || doc.descriptionText || '',
        location: doc.location || 'Remote',
        salary: doc.salary || '',
        postedDate: doc.postedDate || doc.createdAt || new Date(),
        jobType: determineJobType(doc.title, doc.description),
        experienceLevel: determineExperienceLevel(doc.description),
        employmentType: determineEmploymentType(doc.description),
        skills: extractSkills(doc.description),
        remote: doc.isRemote === true || doc.remote === true || true,
        url: doc.url || '',
        credibilityScore: doc.credibilityScore || doc.qualityScore || 5,
        source: doc.source || 'Unknown',
        scrapedDate: doc.scrapedDate || doc.createdAt || new Date(),
        // Add any additional fields you want to standardize
      };
      
      batch.push(transformedDoc);
      processedCount++;
      
      // Insert in batches for better performance
      if (batch.length >= batchSize) {
        targetCollection.insertMany(batch, { ordered: false }).catch(err => {
          console.log(`Warning: Some documents may be duplicates: ${err.message}`);
        });
        batch = [];
        console.log(`Processed ${processedCount} documents...`);
      }
    });
    
    // Insert any remaining documents
    if (batch.length > 0) {
      await targetCollection.insertMany(batch, { ordered: false }).catch(err => {
        console.log(`Warning: Some documents may be duplicates: ${err.message}`);
      });
    }
    
    // Get count after migration
    const targetCountAfter = await targetCollection.countDocuments();
    
    console.log(`\nMigration complete!`);
    console.log(`Documents processed from source: ${processedCount}`);
    console.log(`Target collection (clickclickjob.jobs) after migration: ${targetCountAfter} documents`);
    console.log(`Net new documents added: ${targetCountAfter - targetCountBefore}`);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Helper functions to determine job attributes
function determineJobType(title, description) {
  const titleLower = (title || '').toLowerCase();
  const descLower = (description || '').toLowerCase();
  
  if (titleLower.includes('data entry') || descLower.includes('data entry')) {
    return 'data_entry';
  } else if (titleLower.includes('admin') || descLower.includes('administrative')) {
    return 'admin';
  } else if (titleLower.includes('assistant') || descLower.includes('assistant')) {
    return 'assistant';
  } else if (titleLower.includes('customer') || descLower.includes('customer service')) {
    return 'customer_service';
  } else {
    return 'other';
  }
}

function determineExperienceLevel(description) {
  const descLower = (description || '').toLowerCase();
  
  if (descLower.includes('senior') || descLower.includes('5+ years')) {
    return 'senior';
  } else if (descLower.includes('mid') || descLower.includes('2-5 years') || descLower.includes('2+ years')) {
    return 'mid';
  } else if (descLower.includes('entry') || descLower.includes('junior') || descLower.includes('1+ year')) {
    return 'entry';
  } else {
    return 'not_specified';
  }
}

function determineEmploymentType(description) {
  const descLower = (description || '').toLowerCase();
  
  if (descLower.includes('full-time') || descLower.includes('full time')) {
    return 'full-time';
  } else if (descLower.includes('part-time') || descLower.includes('part time')) {
    return 'part-time';
  } else if (descLower.includes('contract')) {
    return 'contract';
  } else if (descLower.includes('freelance')) {
    return 'freelance';
  } else {
    return 'not_specified';
  }
}

function extractSkills(description) {
  const skills = [];
  const descLower = (description || '').toLowerCase();
  
  // Common skills for admin/data entry
  const skillsList = [
    'Excel', 'Word', 'PowerPoint', 'Google Docs', 'Spreadsheets',
    'Data Entry', 'Typing', 'Administrative', 'Customer Service',
    'Microsoft Office', 'Scheduling', 'Email', 'Communication',
    'Organization', 'Detail-oriented', 'Time Management'
  ];
  
  skillsList.forEach(skill => {
    if (descLower.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  });
  
  return skills.length > 0 ? skills : ['General Admin Skills'];
}

// Run the script
migrateJobData().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
}); 