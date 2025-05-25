/**
 * Script to analyze job data in MongoDB for suspicious content
 * This examines job descriptions, titles, and company names for signs of mock or test data
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function analyzeJobData() {
  // MongoDB connection URI
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
    console.log('Connected to MongoDB successfully');

    // Define the databases to check
    const dbNames = ['clickclickjob', 'test', 'remote-jobs'];
    
    for (const dbName of dbNames) {
      const db = client.db(dbName);
      console.log(`\n==========================================`);
      console.log(`Analyzing job data in database: ${dbName}`);
      console.log(`==========================================`);

      // Check if the jobs collection exists in this database
      const collections = await db.listCollections({ name: 'jobs' }).toArray();
      if (collections.length === 0) {
        console.log(`No 'jobs' collection found in ${dbName} database.`);
        continue;
      }

      const jobsCollection = db.collection('jobs');
      
      // Get total job count
      const totalJobs = await jobsCollection.countDocuments();
      console.log(`Total jobs in ${dbName}.jobs: ${totalJobs}`);
      
      // Check for suspicious company names
      const suspiciousCompanyTerms = ['test', 'mock', 'dummy', 'example', 'sample', 'placeholder', 'acme'];
      console.log('\n1. Checking for suspicious company names:');
      
      let totalSuspiciousCompanies = 0;
      for (const term of suspiciousCompanyTerms) {
        const count = await jobsCollection.countDocuments({
          company: { $regex: term, $options: 'i' }
        });
        
        if (count > 0) {
          const examples = await jobsCollection.find({
            company: { $regex: term, $options: 'i' }
          }).limit(3).toArray();
          
          console.log(`- Companies with '${term}': ${count}`);
          examples.forEach(job => {
            console.log(`  * ${job.company} (${job.title})`);
          });
          
          totalSuspiciousCompanies += count;
        }
      }
      
      if (totalSuspiciousCompanies === 0) {
        console.log('No suspicious company names found.');
      }
      
      // Check for suspicious job titles
      console.log('\n2. Checking for suspicious job titles:');
      const suspiciousTitleTerms = ['test', 'mock', 'sample', 'example', 'dummy'];
      
      let totalSuspiciousTitles = 0;
      for (const term of suspiciousTitleTerms) {
        const count = await jobsCollection.countDocuments({
          title: { $regex: term, $options: 'i' }
        });
        
        if (count > 0) {
          const examples = await jobsCollection.find({
            title: { $regex: term, $options: 'i' }
          }).limit(3).toArray();
          
          console.log(`- Titles with '${term}': ${count}`);
          examples.forEach(job => {
            console.log(`  * ${job.title} (${job.company})`);
          });
          
          totalSuspiciousTitles += count;
        }
      }
      
      if (totalSuspiciousTitles === 0) {
        console.log('No suspicious job titles found.');
      }
      
      // Check for suspicious job descriptions
      console.log('\n3. Checking for suspicious job descriptions:');
      const suspiciousDescTerms = ['this is a test', 'mock job', 'placeholder', 'sample job', 'testing purposes'];
      
      let totalSuspiciousDescriptions = 0;
      for (const term of suspiciousDescTerms) {
        const count = await jobsCollection.countDocuments({
          $or: [
            { description: { $regex: term, $options: 'i' } },
            { descriptionText: { $regex: term, $options: 'i' } }
          ]
        });
        
        if (count > 0) {
          const examples = await jobsCollection.find({
            $or: [
              { description: { $regex: term, $options: 'i' } },
              { descriptionText: { $regex: term, $options: 'i' } }
            ]
          }).limit(2).toArray();
          
          console.log(`- Descriptions with '${term}': ${count}`);
          examples.forEach(job => {
            console.log(`  * ${job.title} at ${job.company}`);
            // Show a short snippet of the description
            const snippet = (job.descriptionText || job.description).substring(0, 100) + '...';
            console.log(`    "${snippet}"`);
          });
          
          totalSuspiciousDescriptions += count;
        }
      }
      
      if (totalSuspiciousDescriptions === 0) {
        console.log('No suspicious job descriptions found.');
      }
      
      // Check for missing essential fields
      console.log('\n4. Checking for jobs with missing essential fields:');
      
      const missingTitleCount = await jobsCollection.countDocuments({ $or: [
        { title: { $exists: false } },
        { title: null },
        { title: "" }
      ]});
      console.log(`- Jobs without title: ${missingTitleCount}`);
      
      const missingCompanyCount = await jobsCollection.countDocuments({ $or: [
        { company: { $exists: false } },
        { company: null },
        { company: "" }
      ]});
      console.log(`- Jobs without company: ${missingCompanyCount}`);
      
      const missingDescriptionCount = await jobsCollection.countDocuments({ $or: [
        { $and: [
          { description: { $exists: false } },
          { descriptionText: { $exists: false } }
        ]},
        { $and: [
          { description: null },
          { descriptionText: null }
        ]},
        { $and: [
          { description: "" },
          { descriptionText: "" }
        ]}
      ]});
      console.log(`- Jobs without description: ${missingDescriptionCount}`);
      
      // Check for extremely short descriptions
      const shortDescCount = await jobsCollection.countDocuments({
        $or: [
          { description: { $exists: true, $type: "string" }, $expr: { $lt: [{ $strLenCP: "$description" }, 50] } },
          { descriptionText: { $exists: true, $type: "string" }, $expr: { $lt: [{ $strLenCP: "$descriptionText" }, 50] } }
        ]
      });
      console.log(`- Jobs with very short descriptions (<50 chars): ${shortDescCount}`);
      
      if (shortDescCount > 0) {
        const shortDescJobs = await jobsCollection.find({
          $or: [
            { description: { $exists: true, $type: "string" }, $expr: { $lt: [{ $strLenCP: "$description" }, 50] } },
            { descriptionText: { $exists: true, $type: "string" }, $expr: { $lt: [{ $strLenCP: "$descriptionText" }, 50] } }
          ]
        }).limit(3).toArray();
        
        shortDescJobs.forEach(job => {
          console.log(`  * ${job.title} at ${job.company}`);
          console.log(`    Description: "${job.descriptionText || job.description}"`);
        });
      }
      
      // Summary for this database
      console.log('\nSummary of potential issues in this database:');
      const totalPotentialIssues = totalSuspiciousCompanies + totalSuspiciousTitles + 
                                  totalSuspiciousDescriptions + missingTitleCount + 
                                  missingCompanyCount + missingDescriptionCount + 
                                  shortDescCount;
      
      if (totalPotentialIssues === 0) {
        console.log('No potential issues found in this database.');
      } else {
        console.log(`Found ${totalPotentialIssues} potential issues that might indicate mock or invalid data.`);
      }
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    if (client) {
      await client.close();
      console.log('\nDisconnected from MongoDB');
    }
  }
}

console.log("MongoDB Job Data Analysis");
console.log("=========================");
console.log("This script will analyze job data to identify potential mock entries.\n");

// Run the script
analyzeJobData().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
}); 