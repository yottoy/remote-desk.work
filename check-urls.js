/**
 * Script to check URLs in the MongoDB database
 * This script will look for suspicious URLs that might indicate mock data
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkUrls() {
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
      console.log(`\nAnalyzing URLs in database: ${dbName}`);

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
      
      // Count jobs with no URL
      const noUrlJobs = await jobsCollection.countDocuments({ url: { $exists: false } });
      console.log(`Jobs without URL field: ${noUrlJobs}`);
      
      // Count jobs with empty URL
      const emptyUrlJobs = await jobsCollection.countDocuments({ url: "" });
      console.log(`Jobs with empty URL: ${emptyUrlJobs}`);
      
      // Count jobs with null URL
      const nullUrlJobs = await jobsCollection.countDocuments({ url: null });
      console.log(`Jobs with null URL: ${nullUrlJobs}`);
      
      // Sample suspicious URLs for inspection
      console.log('\nSampling different URL patterns:');
      
      // Get a sample of very short URLs
      const shortUrls = await jobsCollection.find({ url: { $type: "string", $exists: true, $ne: "" }, $expr: { $lt: [{ $strLenCP: "$url" }, 20] } })
                                         .limit(5).toArray();
      
      console.log(`\nShort URLs (< 20 chars):`);
      if (shortUrls.length === 0) {
        console.log("None found");
      } else {
        shortUrls.forEach(job => {
          console.log(`- ${job.url} (${job.title} at ${job.company})`);
        });
      }
      
      // Look for URLs with suspicious keywords
      const suspiciousTerms = ['placeholder', 'dummy', 'sample', 'test', 'local', 'localhost'];
      
      for (const term of suspiciousTerms) {
        const suspiciousUrls = await jobsCollection.find({
          url: { $regex: term, $options: 'i' }
        }).limit(3).toArray();
        
        console.log(`\nURLs containing '${term}':`);
        if (suspiciousUrls.length === 0) {
          console.log("None found");
        } else {
          suspiciousUrls.forEach(job => {
            console.log(`- ${job.url} (${job.title} at ${job.company})`);
          });
          
          // Count total
          const count = await jobsCollection.countDocuments({
            url: { $regex: term, $options: 'i' }
          });
          if (count > 3) {
            console.log(`  ... and ${count - 3} more`);
          }
        }
      }
      
      // Get URL domain distribution
      console.log('\nTop URL domains:');
      
      // Extract and count domains
      const pipeline = [
        {
          $match: {
            url: { $type: "string", $exists: true, $ne: "" }
          }
        },
        {
          $project: {
            domain: {
              $regexFind: {
                input: "$url",
                regex: "https?://([^/]+)"
              }
            }
          }
        },
        {
          $match: {
            domain: { $ne: null }
          }
        },
        {
          $group: {
            _id: { $arrayElemAt: ["$domain.captures", 0] },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ];
      
      const domainStats = await jobsCollection.aggregate(pipeline).toArray();
      
      domainStats.forEach(stat => {
        console.log(`- ${stat._id}: ${stat.count} jobs`);
      });
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

console.log("MongoDB URL Analysis");
console.log("====================");
console.log("This script will analyze URLs in the database to identify potential mock entries.\n");

// Run the script
checkUrls().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
}); 