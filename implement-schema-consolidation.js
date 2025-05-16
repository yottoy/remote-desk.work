// Schema Consolidation Implementation for ClickClickJob
//
// This script implements the schema standardization and database consolidation
// based on our analysis. Since we have atlasAdmin permissions, we can proceed.

// 1. Standardize field names in each database
print("\n=== STANDARDIZING FIELD NAMES ===");

// For clickclickjob.jobs - Convert 'remote' to 'isRemote'
try {
  print("\nStandardizing clickclickjob.jobs fields:");
  const result1 = db.getSiblingDB("clickclickjob").jobs.updateMany(
    { remote: { $exists: true } },
    { $rename: { "remote": "isRemote" } }
  );
  print(`Updated ${result1.modifiedCount} documents`);
} catch (err) {
  print(`Error updating clickclickjob.jobs: ${err.message}`);
}

// For remote-jobs.jobs - Add isRemote field based on location
try {
  print("\nAdding isRemote field to remote-jobs.jobs:");
  const result2 = db.getSiblingDB("remote-jobs").jobs.updateMany(
    { isRemote: { $exists: false } },
    [{ $set: { 
      isRemote: { 
        $cond: { 
          if: { $regexMatch: { input: "$location", regex: /remote/i } }, 
          then: true, 
          else: false 
        } 
      } 
    }}]
  );
  print(`Updated ${result2.modifiedCount} documents`);
} catch (err) {
  print(`Error updating remote-jobs.jobs: ${err.message}`);
}

// For test.jobs - Ensure consistent date field names
try {
  print("\nStandardizing test.jobs date fields:");
  const result3 = db.getSiblingDB("test").jobs.updateMany(
    { },
    [{ $set: { 
      scrapedDate: { $ifNull: ["$scrapedDate", "$createdAt"] }
    }}]
  );
  print(`Updated ${result3.modifiedCount} documents`);
} catch (err) {
  print(`Error updating test.jobs: ${err.message}`);
}

// 2. Create archive collection structure
print("\n\n=== CREATING ARCHIVE COLLECTION ===");
try {
  // Create jobs_archive if it doesn't exist
  db.getSiblingDB("clickclickjob").createCollection("jobs_archive");
  print("Created jobs_archive collection");
  
  // Create the same indexes on the archive collection
  const indexes = db.getSiblingDB("clickclickjob").jobs.getIndexes();
  
  indexes.forEach(idx => {
    if(idx.name !== "_id_") {
      try {
        const result = db.getSiblingDB("clickclickjob").jobs_archive.createIndex(
          idx.key, 
          { 
            name: idx.name, 
            background: true,
            expireAfterSeconds: idx.expireAfterSeconds 
          }
        );
        print(`Created index ${idx.name} on jobs_archive: ${result}`);
      } catch (err) {
        print(`Error creating index ${idx.name}: ${err.message}`);
      }
    }
  });
} catch (err) {
  print(`Error creating archive collection: ${err.message}`);
}

// 3. Migrate data (only non-existent data to avoid duplicates)
print("\n\n=== MIGRATING DATA TO clickclickjob ===");

// Function to safely migrate documents
function migrateCollection(sourceDb, sourceCollection, targetDb, targetCollection) {
  print(`\nMigrating data from ${sourceDb}.${sourceCollection} to ${targetDb}.${targetCollection}:`);
  
  try {
    // Get total count
    const totalCount = db.getSiblingDB(sourceDb)[sourceCollection].countDocuments();
    print(`Total documents to process: ${totalCount}`);
    
    // Track statistics
    let processed = 0;
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process in batches to avoid excessive memory usage
    const batchSize = 100;
    let lastId = null;
    
    while (true) {
      // Create query for next batch
      const query = lastId ? { _id: { $gt: lastId } } : {};
      
      // Get batch of documents
      const docs = db.getSiblingDB(sourceDb)[sourceCollection]
        .find(query)
        .sort({ _id: 1 })
        .limit(batchSize)
        .toArray();
      
      if (docs.length === 0) break;
      
      // Process each document
      docs.forEach(doc => {
        try {
          // Ensure required fields
          if (!("isRemote" in doc)) {
            if ("remote" in doc) {
              doc.isRemote = doc.remote;
              delete doc.remote;
            } else {
              doc.isRemote = false;
            }
          }
          
          // Add source if missing
          if (!doc.source) {
            doc.source = `${sourceDb}-migration`;
          }
          
          // Try to insert (will fail if duplicate)
          try {
            db.getSiblingDB(targetDb)[targetCollection].insertOne(doc);
            inserted++;
          } catch (insertErr) {
            // If duplicate key error, skip
            if (insertErr.code === 11000) {
              skipped++;
            } else {
              throw insertErr;
            }
          }
        } catch (docErr) {
          errors++;
        }
        
        processed++;
        lastId = doc._id;
      });
      
      // Print progress
      print(`Processed ${processed}/${totalCount} documents (${inserted} inserted, ${skipped} skipped, ${errors} errors)`);
    }
    
    print(`Migration completed: ${processed} processed, ${inserted} inserted, ${skipped} skipped, ${errors} errors`);
  } catch (err) {
    print(`Error during migration: ${err.message}`);
  }
}

// Migrate remote-jobs.jobs to clickclickjob.jobs
migrateCollection("remote-jobs", "jobs", "clickclickjob", "jobs");

// Migrate test.jobs to clickclickjob.jobs
migrateCollection("test", "jobs", "clickclickjob", "jobs");

// 4. Add schema validation to the target collection
print("\n\n=== ADDING SCHEMA VALIDATION ===");
try {
  const result = db.getSiblingDB("clickclickjob").runCommand({
    collMod: "jobs",
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["title", "company", "description", "isRemote"],
        properties: {
          title: { bsonType: "string" },
          company: { bsonType: "string" },
          description: { bsonType: "string" },
          isRemote: { bsonType: "bool" },
          postedDate: { bsonType: "date" },
          url: { bsonType: "string" },
          location: { bsonType: "string" },
          salary: { oneOf: [
            { bsonType: "string" },
            { bsonType: "int" },
            { bsonType: "double" }
          ]},
          credibilityScore: { oneOf: [
            { bsonType: "int" },
            { bsonType: "double" }
          ]},
          jobType: { bsonType: "string" }
        }
      }
    },
    validationLevel: "moderate",
    validationAction: "warn"
  });
  
  print("Schema validation added:");
  printjson(result);
} catch (err) {
  print(`Error adding schema validation: ${err.message}`);
}

print("\n\n=== SCHEMA CONSOLIDATION COMPLETED ===");
print(`
Next steps:
1. Verify data consistency: db.jobs.find({ isRemote: { $exists: false } })
2. Monitor validation warnings in the MongoDB logs
3. Update applications to use the consolidated database
4. Archive or drop the original collections after testing`); 