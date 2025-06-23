const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkJobDescription() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  console.log('Checking job descriptions...\n');
  
  // Check a few recent jobs
  const jobs = await collection.find({}).sort({ scrapedDate: -1 }).limit(10).toArray();
  
  console.log(`Found ${jobs.length} recent jobs\n`);
  
  let missingDescriptions = 0;
  let missingDescriptionText = 0;
  let emptyDescriptions = 0;
  
  jobs.forEach((job, index) => {
    console.log(`${index + 1}. ${job.title} at ${job.company}`);
    console.log(`   ID: ${job._id}`);
    console.log(`   Description exists: ${!!job.description}`);
    console.log(`   DescriptionText exists: ${!!job.descriptionText}`);
    
    if (!job.description) {
      missingDescriptions++;
      console.log(`   ❌ MISSING description field`);
    } else if (job.description.trim().length === 0) {
      emptyDescriptions++;
      console.log(`   ❌ EMPTY description field`);
    } else {
      console.log(`   ✅ Description length: ${job.description.length}`);
    }
    
    if (!job.descriptionText) {
      missingDescriptionText++;
      console.log(`   ❌ MISSING descriptionText field`);
    } else if (job.descriptionText.trim().length === 0) {
      console.log(`   ❌ EMPTY descriptionText field`);
    } else {
      console.log(`   ✅ DescriptionText length: ${job.descriptionText.length}`);
    }
    
    console.log('');
  });
  
  console.log('SUMMARY:');
  console.log(`Jobs missing description: ${missingDescriptions}/${jobs.length}`);
  console.log(`Jobs missing descriptionText: ${missingDescriptionText}/${jobs.length}`);
  console.log(`Jobs with empty descriptions: ${emptyDescriptions}/${jobs.length}`);
  
  // Check total in database
  const totalJobs = await collection.countDocuments();
  const jobsWithoutDescription = await collection.countDocuments({ 
    $or: [
      { description: { $exists: false } },
      { description: null },
      { description: "" }
    ]
  });
  
  const jobsWithoutDescriptionText = await collection.countDocuments({ 
    $or: [
      { descriptionText: { $exists: false } },
      { descriptionText: null },
      { descriptionText: "" }
    ]
  });
  
  console.log(`\nDATABASE TOTALS:`);
  console.log(`Total jobs: ${totalJobs}`);
  console.log(`Jobs without description: ${jobsWithoutDescription} (${Math.round(jobsWithoutDescription/totalJobs*100)}%)`);
  console.log(`Jobs without descriptionText: ${jobsWithoutDescriptionText} (${Math.round(jobsWithoutDescriptionText/totalJobs*100)}%)`);
  
  await client.close();
}

checkJobDescription().catch(console.error); 