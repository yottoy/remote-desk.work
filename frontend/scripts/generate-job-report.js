import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

async function generateJobReport() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clickclickjob';
  const MONGODB_DB = process.env.MONGODB_DB || 'clickclickjob';
  const EMAIL_USER = 'daily.app.2024@gmail.com';
  const EMAIL_PASS = '***REMOVED***';
  const REPORT_EMAIL = 'yotamt@gmail.com';

  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(MONGODB_DB);
    const jobsCollection = db.collection('jobs');

    // Get date range for the last 24 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get total jobs count
    const totalJobs = await jobsCollection.countDocuments();

    // Get jobs added in the last 24 hours
    const newJobs = await jobsCollection.countDocuments({
      createdAt: { $gte: yesterday }
    });

    // Get jobs removed in the last 24 hours (jobs that were updated but no longer exist)
    const removedJobs = await jobsCollection.countDocuments({
      updatedAt: { $gte: yesterday },
      isDeleted: true
    });

    // Get jobs by category
    const jobsByCategory = await jobsCollection.aggregate([
      { $group: { _id: '$jobCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Get jobs by source
    const jobsBySource = await jobsCollection.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    // Generate HTML report
    const reportHtml = `
      <h2>Daily Job Report - ${now.toLocaleDateString()}</h2>
      
      <h3>Summary</h3>
      <ul>
        <li>Total Jobs: ${totalJobs}</li>
        <li>New Jobs (24h): ${newJobs}</li>
        <li>Removed Jobs (24h): ${removedJobs}</li>
      </ul>

      <h3>Jobs by Category</h3>
      <ul>
        ${jobsByCategory.map(cat => `<li>${cat._id || 'Uncategorized'}: ${cat.count}</li>`).join('')}
      </ul>

      <h3>Jobs by Source</h3>
      <ul>
        ${jobsBySource.map(source => `<li>${source._id || 'Unknown'}: ${source.count}</li>`).join('')}
      </ul>

      <p>Report generated at: ${now.toLocaleString()}</p>
    `;

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });

    const mailOptions = {
      from: EMAIL_USER,
      to: REPORT_EMAIL,
      subject: `ClickClickJob Daily Report - ${now.toLocaleDateString()}`,
      html: reportHtml
    };

    await transporter.sendMail(mailOptions);
    console.log('Report email sent successfully');

  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Execute if run directly
if (import.meta.url === import.meta.main) {
  generateJobReport()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to generate report:', error);
      process.exit(1);
    });
}

export default generateJobReport; 