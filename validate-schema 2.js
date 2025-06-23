// MongoDB Schema Validation Script for ClickClickJob.com
// Run with: node validate-schema.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function addSchemaValidation() {
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
    
    // Connect to collection
    const db = client.db('clickclickjob');
    const jobsCollection = db.collection('jobs');
    
    // Check if collection has validation rules
    const collectionInfo = await db.command({ listCollections: 1, filter: { name: 'jobs' } });
    const collectionDetails = collectionInfo.cursor.firstBatch[0];
    console.log('Current validation options:');
    console.log(JSON.stringify(collectionDetails.options || {}, null, 2));
    
    // Create schema validator for jobs collection
    console.log('\nAdding schema validation...');
    
    await db.command({
      collMod: "jobs",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["title", "company", "description", "remote", "postedDate"],
          properties: {
            title: {
              bsonType: "string",
              description: "Job title - required string"
            },
            company: {
              bsonType: "string",
              description: "Company name - required string"
            },
            description: {
              bsonType: "string",
              description: "Job description - required string"
            },
            location: {
              bsonType: "string",
              description: "Job location - string"
            },
            salary: {
              oneOf: [
                { bsonType: "string" },
                { bsonType: "int" },
                { bsonType: "double" },
                { bsonType: "null" }
              ],
              description: "Salary information - can be numeric or string (for ranges)"
            },
            postedDate: {
              bsonType: "date",
              description: "Date job was posted - required date"
            },
            jobType: {
              enum: ["data_entry", "admin", "assistant", "customer_service", "other", null],
              description: "Type of job - enum of predefined values"
            },
            experienceLevel: {
              enum: ["entry", "mid", "senior", "not_specified", null],
              description: "Required experience level - enum of predefined values"
            },
            employmentType: {
              enum: ["full-time", "part-time", "contract", "freelance", "not_specified", null],
              description: "Type of employment - enum of predefined values"
            },
            skills: {
              bsonType: ["array"],
              description: "Array of skills required for the job",
              items: {
                bsonType: "string"
              }
            },
            remote: {
              bsonType: "bool",
              description: "Whether job is remote - required boolean"
            },
            url: {
              bsonType: "string",
              description: "URL to job posting - string"
            },
            credibilityScore: {
              bsonType: ["double", "int"],
              minimum: 0,
              maximum: 10,
              description: "Job credibility score from 0-10"
            },
            source: {
              bsonType: "string",
              description: "Source of the job listing - string"
            },
            scrapedDate: {
              bsonType: "date",
              description: "Date job was scraped - date"
            }
          }
        }
      },
      validationLevel: "moderate", // Can be "off", "strict" or "moderate"
      validationAction: "warn"     // Can be "error" or "warn"
    });
    
    console.log('Schema validation added with "warn" action and "moderate" level');
    console.log('This means existing documents will not be validated, but new ones will be checked');
    console.log('And validation failures will be logged but still allowed (use "error" to reject them)');
    
    // Verify validation was added
    const updatedCollectionInfo = await db.command({ listCollections: 1, filter: { name: 'jobs' } });
    const updatedCollectionDetails = updatedCollectionInfo.cursor.firstBatch[0];
    console.log('\nUpdated validation options:');
    console.log(JSON.stringify(updatedCollectionDetails.options || {}, null, 2));
    
    console.log('\nSchema validation setup complete!');
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the script
addSchemaValidation().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
}); 