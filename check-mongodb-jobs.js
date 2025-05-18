/**
 * Check MongoDB Jobs Details
 * 
 * This script connects to MongoDB and shows details about the jobs collection
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkJobs() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }
  
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    const db = client.db('clickclickjob');
    const jobsCollection = db.collection('jobs');
    
    // Get total job count
    const totalCount = await jobsCollection.countDocuments();
    console.log(`\nTotal jobs in database: ${totalCount}`);
    
    // Get recent jobs
    const recentJobs = await jobsCollection.find({})
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();
    
    console.log('\nMost recent jobs:');
    recentJobs.forEach((job, i) => {
      console.log(`${i+1}. ${job.title} at ${job.company}`);
      console.log(`   Updated: ${job.updatedAt}`);
      console.log(`   Source: ${job.source || job.site_source || 'Unknown'}`);
      console.log(`   URL: ${job.url}`);
      console.log(`   Description length: ${job.description ? job.description.length : 0} chars`);
      console.log();
    });
    
    // Check for jobs with HTML formatting
    const jobsWithHTML = await jobsCollection.countDocuments({ 
      description: { $regex: '<[^>]+>' } 
    });
    
    console.log(`\nJobs with HTML formatting: ${jobsWithHTML} (${Math.round(jobsWithHTML/totalCount*100)}%)`);
    
    // Check for jobs by source
    const sourceAgg = await jobsCollection.aggregate([
      { $group: { 
          _id: { $ifNull: ["$source", "$site_source"] }, 
          count: { $sum: 1 } 
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\nJobs by source:');
    sourceAgg.forEach(src => {
      console.log(`${src._id || 'Unknown'}: ${src.count} jobs`);
    });
    
    // Sample description
    const sampleJob = await jobsCollection.findOne({ 
      description: { $regex: '<[^>]+>' } 
    });
    
    if (sampleJob) {
      console.log('\nSample job description (first 300 chars):');
      console.log(sampleJob.description.substring(0, 300) + '...');
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

checkJobs().catch(console.error); 