require('dotenv').config({ path: './frontend/.env.local' });

async function sendDigestNow() {
  const CRON_SECRET = process.env.CRON_SECRET;
  
  if (!CRON_SECRET) {
    console.error('❌ CRON_SECRET not found');
    return;
  }

  console.log('\n📧 Triggering Weekly Digest for ALL Subscribers...\n');
  console.log('Sending to:');
  console.log('  1. yotamt@gmail.com');
  console.log('  2. subscriber1@example.com');
  console.log('  3. subscriber2@example.com');
  console.log('  4. subscriber4@example.com');
  console.log('  5. subscriber3@example.com\n');

  const response = await fetch('https://clickclickjob.com/api/digest/weekly', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✅ SUCCESS!\n');
    console.log('📊 Results:');
    console.log(`   Jobs sent: ${data.jobsSent}`);
    console.log(`   Subscribers: ${data.subscriberCount}`);
    console.log(`   Message: ${data.message}`);
    console.log(`   Time: ${data.timestamp}\n`);
    console.log('🎉 All subscribers should receive the email within 1-2 minutes!\n');
  } else {
    console.error('❌ ERROR:', data);
  }
}

sendDigestNow().catch(console.error);
