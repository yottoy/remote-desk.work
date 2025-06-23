const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixMissingDescriptions() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('clickclickjob');
  const collection = db.collection('jobs');
  
  console.log('🔧 Fixing missing descriptions for SEO compliance...\n');
  
  // Find jobs without proper descriptions
  const jobsWithoutDescription = await collection.find({
    $or: [
      { description: { $exists: false } },
      { description: null },
      { description: "" }
    ]
  }).toArray();
  
  const jobsWithoutDescriptionText = await collection.find({
    $or: [
      { descriptionText: { $exists: false } },
      { descriptionText: null },
      { descriptionText: "" }
    ]
  }).toArray();
  
  console.log(`📊 Found ${jobsWithoutDescription.length} jobs without description`);
  console.log(`📊 Found ${jobsWithoutDescriptionText.length} jobs without descriptionText\n`);
  
  let fixed = 0;
  let processed = 0;
  
  // Get all jobs that need fixing
  const jobsToFix = await collection.find({
    $or: [
      { description: { $exists: false } },
      { description: null },
      { description: "" },
      { descriptionText: { $exists: false } },
      { descriptionText: null },
      { descriptionText: "" }
    ]
  }).toArray();
  
  console.log(`🔧 Processing ${jobsToFix.length} jobs that need description fixes...\n`);
  
  for (const job of jobsToFix) {
    processed++;
    
    let needsUpdate = false;
    const updates = {};
    
    // Generate description if missing
    if (!job.description || job.description.trim() === '') {
      if (job.descriptionText && job.descriptionText.trim() !== '') {
        // Use descriptionText as description
        updates.description = job.descriptionText;
        needsUpdate = true;
      } else {
        // Generate a basic description
        const title = job.title || 'Remote Position';
        const company = job.company || 'Company';
        const location = job.location || 'Remote';
        
        const generatedDescription = `${title} at ${company}. This is a remote position based in ${location}. ` +
          `We are seeking a qualified candidate for this remote administrative/data entry role. ` +
          `This position offers the flexibility of working from home with competitive compensation. ` +
          `Apply now to join our team in this remote opportunity.`;
        
        updates.description = generatedDescription;
        needsUpdate = true;
      }
    }
    
    // Generate descriptionText if missing
    if (!job.descriptionText || job.descriptionText.trim() === '') {
      if (job.description && job.description.trim() !== '') {
        // Convert HTML description to text
        const textDescription = job.description
          .replace(/<[^>]*>/g, ' ') // Remove HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        updates.descriptionText = textDescription;
        needsUpdate = true;
      } else if (updates.description) {
        // Use the generated description
        updates.descriptionText = updates.description;
        needsUpdate = true;
      }
    }
    
    // Update the job if needed
    if (needsUpdate) {
      try {
        await collection.updateOne(
          { _id: job._id },
          { $set: updates }
        );
        fixed++;
        
        if (fixed % 100 === 0) {
          console.log(`✅ Fixed ${fixed} jobs so far...`);
        }
      } catch (error) {
        console.error(`❌ Error updating job ${job._id}:`, error.message);
      }
    }
  }
  
  console.log(`\n🎉 COMPLETION SUMMARY:`);
  console.log(`Total jobs processed: ${processed}`);
  console.log(`Jobs successfully fixed: ${fixed}`);
  console.log(`Fix rate: ${Math.round(fixed/processed*100)}%\n`);
  
  // Verify the fixes
  console.log('🔍 Verifying fixes...');
  
  const remainingWithoutDescription = await collection.countDocuments({
    $or: [
      { description: { $exists: false } },
      { description: null },
      { description: "" }
    ]
  });
  
  const remainingWithoutDescriptionText = await collection.countDocuments({
    $or: [
      { descriptionText: { $exists: false } },
      { descriptionText: null },
      { descriptionText: "" }
    ]
  });
  
  console.log(`📊 Remaining jobs without description: ${remainingWithoutDescription}`);
  console.log(`📊 Remaining jobs without descriptionText: ${remainingWithoutDescriptionText}`);
  
  if (remainingWithoutDescription === 0 && remainingWithoutDescriptionText === 0) {
    console.log('✅ All jobs now have proper descriptions for SEO!');
  } else {
    console.log('⚠️  Some jobs still need attention');
  }
  
  await client.close();
}

fixMissingDescriptions().catch(console.error); 