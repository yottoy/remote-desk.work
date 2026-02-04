require('dotenv').config({ path: './frontend/.env.local' });

async function listSubscribers() {
  const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
  const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;

  console.log('\n📧 All Subscribers\n');
  console.log('==================\n');

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

  const data = await response.json();
  const subscribers = data.data || [];
  
  console.log(`Total: ${subscribers.length} subscribers\n`);

  subscribers.forEach((sub, i) => {
    console.log(`${i+1}. ${sub.email}`);
    console.log(`   Status: ${sub.status}`);
    console.log(`   Subscribed: ${new Date(sub.subscribed_at).toLocaleDateString()}`);
    console.log(`   Source: ${sub.source || 'website'}`);
    console.log('');
  });

  console.log(`\nView in MailerLite dashboard:`);
  console.log(`https://dashboard.mailerlite.com/subscribers\n`);
}

listSubscribers().catch(console.error);
