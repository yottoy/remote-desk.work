/**
 * MongoDB Setup Helper
 * 
 * This script helps set up and test a MongoDB connection
 * for the ClickClickJob scraper application.
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const readline = require('readline');
const mongoose = require('mongoose');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function testMongoDBConnection(uri) {
  console.log(`\nTesting connection to: ${uri.replace(/(?<=mongodb\+srv:\/\/[^:]+:)[^@]+(?=@)/, '******')}`);
  
  try {
    // Test with MongoClient first
    console.log('Testing with MongoClient...');
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    await client.connect();
    console.log('✅ Successfully connected to MongoDB with MongoClient!');
    
    const db = client.db();
    console.log(`Connected to database: ${db.databaseName}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    if (collections.length > 0) {
      console.log(`Collections found: ${collections.map(c => c.name).join(', ')}`);
    } else {
      console.log('No collections found yet. This is normal for a new database.');
    }
    
    // Create a test collection if it doesn't exist
    if (!collections.some(c => c.name === 'test_connection')) {
      console.log('Creating a test collection...');
      await db.createCollection('test_connection');
      console.log('✅ Test collection created successfully');
      
      // Insert a test document
      await db.collection('test_connection').insertOne({
        test: true,
        message: 'Connection successful',
        timestamp: new Date()
      });
      console.log('✅ Test document inserted successfully');
    }
    
    await client.close();
    console.log('Connection closed');
    
    return true;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    return false;
  }
}

async function updateEnvFile(uri) {
  const envPath = '.env';
  let envContent = '';
  
  try {
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace or add MONGODB_URI
      if (envContent.includes('MONGODB_URI=')) {
        envContent = envContent.replace(/MONGODB_URI=.*(\r?\n|$)/, `MONGODB_URI=${uri}$1`);
      } else {
        envContent += `\nMONGODB_URI=${uri}\n`;
      }
    } else {
      envContent = `MONGODB_URI=${uri}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Updated ${envPath} with MongoDB connection URI`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating .env file: ${error.message}`);
    return false;
  }
}

async function createLocalConfig() {
  console.log('\n=== Local MongoDB Setup ===');
  console.log('Make sure MongoDB is installed and running locally');
  
  const dbName = await promptUser('Enter database name (default: remote-jobs): ') || 'remote-jobs';
  const port = await promptUser('Enter MongoDB port (default: 27017): ') || '27017';
  const uri = `mongodb://localhost:${port}/${dbName}`;
  
  return uri;
}

async function createAtlasConfig() {
  console.log('\n=== MongoDB Atlas Setup ===');
  console.log('You will need your MongoDB Atlas connection string');
  console.log('Format: mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority');
  
  const uri = await promptUser('Enter your full MongoDB Atlas connection string: ');
  if (!uri || !uri.startsWith('mongodb+srv://')) {
    console.error('❌ Invalid MongoDB Atlas connection string');
    return null;
  }
  
  return uri;
}

async function main() {
  console.log('=== MongoDB Setup for ClickClickJob Scraper ===\n');
  
  const setupType = await promptUser('Choose setup type (1 for local MongoDB, 2 for MongoDB Atlas): ');
  
  let uri;
  if (setupType === '1') {
    uri = await createLocalConfig();
  } else if (setupType === '2') {
    uri = await createAtlasConfig();
  } else {
    console.error('❌ Invalid choice. Please run the script again and select 1 or 2.');
    process.exit(1);
  }
  
  if (!uri) {
    console.error('❌ Failed to get a valid MongoDB URI');
    process.exit(1);
  }
  
  const connectionSuccess = await testMongoDBConnection(uri);
  
  if (connectionSuccess) {
    const saveToEnv = await promptUser('Update .env file with this connection string? (y/n): ');
    if (saveToEnv.toLowerCase() === 'y') {
      await updateEnvFile(uri);
    }
    
    console.log('\n=== Next Steps ===');
    console.log('1. Run your scraper: node test-admin-scraper.js');
    console.log('2. Check the logs directory for job data');
    console.log('3. Verify in MongoDB that data has been saved');
  } else {
    console.log('\n❌ Connection test failed. Please check your MongoDB setup and try again.');
  }
  
  rl.close();
}

main().catch(console.error); 