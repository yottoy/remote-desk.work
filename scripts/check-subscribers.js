#!/usr/bin/env node
/**
 * Check who's subscribed to your email list
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: require('path').join(__dirname, '../frontend/.env.local') });

async function checkSubscribers() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not configured');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    
    // Check for subscribers collection
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('📂 Available collections:', collectionNames.join(', '));
    
    const subscriberCollections = collectionNames.filter(name => 
      name.includes('subscriber') || name.includes('email') || name.includes('newsletter')
    );
    
    if (subscriberCollections.length === 0) {
      console.log('\n⚠️  No subscriber collections found!');
      console.log('   This means subscribers might not be saving to your database.\n');
      return;
    }

    console.log('\n📧 Subscriber Collections Found:', subscriberCollections.join(', '));

    // Check each subscriber collection
    for (const collName of subscriberCollections) {
      const collection = db.collection(collName);
      const count = await collection.countDocuments();
      console.log(`\n📊 Collection: ${collName}`);
      console.log(`   Total documents: ${count}`);
      
      if (count > 0) {
        const subscribers = await collection.find().limit(10).toArray();
        console.log('\n   Sample subscribers:');
        subscribers.forEach((sub, i) => {
          console.log(`   ${i + 1}. Email: ${sub.email || 'N/A'}`);
          console.log(`      Status: ${sub.status || 'N/A'}`);
          console.log(`      Subscribed: ${sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A'}`);
          console.log(`      Source: ${sub.source || 'N/A'}`);
        });
      }
    }

    // Check if there's a MailerLite sync issue
    console.log('\n\n🔄 MailerLite Sync Check:');
    const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
    
    if (MAILERLITE_API_KEY) {
      const https = require('https');
      const options = {
        hostname: 'connect.mailerlite.com',
        path: '/api/subscribers',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      };

      await new Promise((resolve, reject) => {
        https.get(options, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              console.log(`   MailerLite has ${data.data?.length || 0} subscribers`);
              if (data.data && data.data.length > 0) {
                console.log('\n   MailerLite subscribers:');
                data.data.forEach((sub, i) => {
                  console.log(`   ${i + 1}. ${sub.email} (Status: ${sub.status})`);
                });
              }
              resolve();
            } catch (e) {
              console.log('   Error parsing MailerLite response:', body);
              resolve();
            }
          });
        }).on('error', reject);
      });
    } else {
      console.log('   MailerLite API key not configured');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkSubscribers();
