const { MongoClient } = require('mongodb');
require('dotenv').config();

async function getCurrentJobCount() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  const count = await collection.countDocuments();
  console.log('📊 Current jobs in database:', count);
  
  await client.close();
}

getCurrentJobCount().catch(console.error); 