require('dotenv').config({ path: './frontend/.env.local' });
const { MongoClient } = require('mongodb');

async function importSubscribers() {
  const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
  const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB;

  if (!MAILERLITE_API_KEY || !MAILERLITE_GROUP_ID) {
    console.error('❌ MailerLite credentials not found');
    return;
  }

  console.log('\n📥 Importing subscribers from MailerLite to MongoDB...\n');

  // Fetch from MailerLite
  const response = await fetch(
    `https://connect.mailerlite.com/api/groups/${MAILERLITE_GROUP_ID}/subscribers`,
    {
      headers: {
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );

  if (!response.ok) {
    console.error(`❌ MailerLite API error: ${response.status}`);
    return;
  }

  const data = await response.json();
  const subscribers = data.data || [];
  
  console.log(`✅ Found ${subscribers.length} subscribers in MailerLite\n`);

  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  const subscribersCollection = db.collection('subscribers');

  // Upsert each subscriber
  for (const subscriber of subscribers) {
    await subscribersCollection.updateOne(
      { email: subscriber.email },
      {
        $set: {
          email: subscriber.email,
          status: subscriber.status,
          source: subscriber.source || 'mailerlite',
          subscribedAt: subscriber.subscribed_at || new Date(),
          fields: subscriber.fields || {},
          lastSyncedFromMailerLite: new Date(),
          mailerliteId: subscriber.id
        }
      },
      { upsert: true }
    );
    console.log(`✓ ${subscriber.email} (${subscriber.status})`);
  }

  const count = await subscribersCollection.countDocuments();
  console.log(`\n✅ MongoDB now has ${count} subscribers`);

  await client.close();
}

importSubscribers().catch(console.error);
