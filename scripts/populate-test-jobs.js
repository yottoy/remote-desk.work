const { MongoClient } = require('mongodb');
require('dotenv').config();

async function populateTestJobs() {
  console.log('Populating test jobs in MongoDB...');
  
  if (!process.env.MONGODB_URI) {
    console.error('ERROR: MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || 'clickclickjob';
  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(process.env.MONGODB_URI);
    console.log('Connecting to MongoDB...');
    
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    // Get database and collection
    const db = client.db(dbName);
    const jobsCollection = db.collection('jobs');
    
    // Sample job data
    const sampleJobs = [
      {
        title: "Remote Data Entry Specialist",
        company: "ABC Company",
        description: "We're looking for a detail-oriented data entry specialist who can work remotely...",
        location: "Remote",
        salary: 45000,
        postedDate: new Date(),
        jobType: "data_entry",
        experienceLevel: "entry",
        employmentType: "full-time",
        skills: ["Excel", "Typing", "Attention to Detail"],
        remote: true,
        url: "https://example.com/job1",
        credibilityScore: 0.8
      },
      {
        title: "Virtual Administrative Assistant",
        company: "XYZ Corp",
        description: "Support executives remotely with calendar management, email correspondence...",
        location: "Remote, US-Only",
        salary: 52000,
        postedDate: new Date(),
        jobType: "admin",
        experienceLevel: "mid",
        employmentType: "full-time",
        skills: ["Microsoft Office", "Calendar Management", "Communication"],
        remote: true,
        url: "https://example.com/job2",
        credibilityScore: 0.9
      },
      {
        title: "Remote Customer Service Representative",
        company: "Service Co.",
        description: "Handle customer inquiries via email, chat, and phone...",
        location: "Remote",
        salary: 38000,
        postedDate: new Date(),
        jobType: "customer_service",
        experienceLevel: "entry",
        employmentType: "full-time",
        skills: ["Communication", "Problem Solving", "Customer Support"],
        remote: true,
        url: "https://example.com/job3",
        credibilityScore: 0.75
      },
      {
        title: "Data Entry Clerk - Work From Home",
        company: "DataFlow Inc",
        description: "Input customer information into our database with high accuracy...",
        location: "Remote",
        salary: 35000,
        postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        jobType: "data_entry",
        experienceLevel: "entry",
        employmentType: "part-time",
        skills: ["Data Entry", "Typing", "Google Sheets"],
        remote: true,
        url: "https://example.com/job4",
        credibilityScore: 0.7
      },
      {
        title: "Remote Executive Assistant",
        company: "Tech Leaders",
        description: "Support C-level executives with scheduling, travel arrangements...",
        location: "Remote, US-Only",
        salary: 65000,
        postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        jobType: "admin",
        experienceLevel: "senior",
        employmentType: "full-time",
        skills: ["Calendar Management", "Travel Coordination", "Executive Support"],
        remote: true,
        url: "https://example.com/job5",
        credibilityScore: 0.85
      }
    ];
    
    // Clear existing jobs (optional)
    console.log('Clearing existing jobs...');
    await jobsCollection.deleteMany({});
    
    // Insert sample jobs
    console.log('Inserting sample jobs...');
    const result = await jobsCollection.insertMany(sampleJobs);
    
    console.log(`✅ ${result.insertedCount} jobs inserted successfully!`);
    
    // Count jobs by type
    const counts = {
      total: await jobsCollection.countDocuments(),
      admin: await jobsCollection.countDocuments({ jobType: 'admin' }),
      dataEntry: await jobsCollection.countDocuments({ jobType: 'data_entry' }),
      customerService: await jobsCollection.countDocuments({ jobType: 'customer_service' })
    };
    
    console.log('Job counts by type:');
    console.log(`- Total jobs: ${counts.total}`);
    console.log(`- Admin jobs: ${counts.admin}`);
    console.log(`- Data entry jobs: ${counts.dataEntry}`);
    console.log(`- Customer service jobs: ${counts.customerService}`);
    
    return counts;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return null;
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Execute if run directly
if (require.main === module) {
  populateTestJobs()
    .then(result => {
      if (result) {
        console.log('✅ Database successfully populated with test jobs!');
        process.exit(0);
      } else {
        console.error('❌ Failed to populate database.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = populateTestJobs; 