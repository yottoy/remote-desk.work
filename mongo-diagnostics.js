// MongoDB Diagnostics Script for ClickClickJob

// Databases to analyze
const databases = ['clickclickjob', 'remote-jobs', 'test'];
const collectionName = 'jobs';

// For each database, run diagnostics
databases.forEach(dbName => {
  print(`\n\n======= DATABASE: ${dbName} =======\n`);
  const currentDb = db.getSiblingDB(dbName);
  
  try {
    // Check if collection exists
    const collections = currentDb.getCollectionNames();
    if (!collections.includes(collectionName)) {
      print(`Collection '${collectionName}' does not exist in database '${dbName}'.`);
      return; // Skip to next database
    }
    
    // Basic Schema Analysis
    print("\n=== SCHEMA ANALYSIS ===");
    print(`\nSample Document from ${dbName}.${collectionName}:`);
    const sampleDoc = currentDb[collectionName].findOne();
    if (sampleDoc) printjson(sampleDoc);
    else print(`No documents found in ${dbName}.${collectionName}`);
  
    print(`\nRandom Sample (up to 3 documents) from ${dbName}.${collectionName}:`);
    try {
      const samples = currentDb[collectionName].aggregate([{ $sample: { size: 3 } }]).toArray();
      if (samples.length) samples.forEach(doc => printjson(doc));
      else print(`No documents found in ${dbName}.${collectionName}`);
    } catch (err) {
      print(`Error getting sample: ${err.message}`);
    }
  
    // Count fields and their types without using $objectToArray
    print(`\nField Distribution for ${dbName}.${collectionName}:`);
    try {
      const fieldAnalysis = {};
      
      // Get a sample of documents to analyze
      const sampleDocs = currentDb[collectionName].find().limit(100).toArray();
      
      // Count field occurrences and types
      sampleDocs.forEach(doc => {
        Object.entries(doc).forEach(([key, value]) => {
          if (!fieldAnalysis[key]) {
            fieldAnalysis[key] = { 
              count: 0, 
              types: new Set() 
            };
          }
          
          fieldAnalysis[key].count++;
          fieldAnalysis[key].types.add(typeof value);
          
          // For special types
          if (value instanceof Date) {
            fieldAnalysis[key].types.add('date');
          } else if (Array.isArray(value)) {
            fieldAnalysis[key].types.add('array');
            if (value.length > 0) {
              fieldAnalysis[key].types.add(`array<${typeof value[0]}>`);
            }
          } else if (value instanceof ObjectId) {
            fieldAnalysis[key].types.add('objectId');
          }
        });
      });
      
      // Convert to array and sort by count
      const fieldResults = Object.entries(fieldAnalysis).map(([field, info]) => ({
        field,
        count: info.count,
        types: Array.from(info.types)
      })).sort((a, b) => b.count - a.count);
      
      fieldResults.forEach(result => printjson(result));
    } catch (err) {
      print(`Error analyzing fields: ${err.message}`);
    }
  
    // Index Analysis
    print(`\n=== INDEX ANALYSIS for ${dbName}.${collectionName} ===`);
    print("\nExisting Indexes:");
    try {
      const indexes = currentDb[collectionName].getIndexes();
      printjson(indexes);
    } catch (err) {
      print(`Error getting indexes: ${err.message}`);
    }
  
    print("\nCollection Statistics:");
    try {
      const stats = currentDb[collectionName].stats();
      printjson(stats);
    } catch (err) {
      print(`Error getting collection stats: ${err.message}`);
    }
  
    // TTL Analysis
    print(`\n=== TTL ANALYSIS for ${dbName}.${collectionName} ===`);
    print("\nTTL Indexes:");
    try {
      const ttlIndexes = currentDb[collectionName].getIndexes().filter(idx => idx.expireAfterSeconds !== undefined);
      if (ttlIndexes.length) ttlIndexes.forEach(idx => printjson(idx));
      else print("No TTL indexes found");
    } catch (err) {
      print(`Error analyzing TTL indexes: ${err.message}`);
    }
  
    // Find the date field(s) based on sample document
    let dateFields = [];
    if (sampleDoc) {
      for (const [key, value] of Object.entries(sampleDoc)) {
        if (value instanceof Date) {
          dateFields.push(key);
        }
      }
    }
    
    print(`\nDetected Date Fields: ${dateFields.join(', ') || 'None'}`);
    
    // For each date field, analyze document age distribution
    dateFields.forEach(dateField => {
      print(`\nDocument Age Distribution by ${dateField}:`);
      
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
        const query30days = {};
        query30days[dateField] = { $gte: thirtyDaysAgo };
        print(`Last 30 days: ${currentDb[collectionName].countDocuments(query30days)}`);
        
        const query30to60 = {};
        query30to60[dateField] = { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo };
        print(`30-60 days old: ${currentDb[collectionName].countDocuments(query30to60)}`);
        
        const query60to90 = {};
        query60to90[dateField] = { $lt: sixtyDaysAgo, $gte: ninetyDaysAgo };
        print(`60-90 days old: ${currentDb[collectionName].countDocuments(query60to90)}`);
        
        const queryOlder90 = {};
        queryOlder90[dateField] = { $lt: ninetyDaysAgo };
        print(`Older than 90 days: ${currentDb[collectionName].countDocuments(queryOlder90)}`);
      } catch (err) {
        print(`Error analyzing date distribution: ${err.message}`);
      }
    });
  
    // Query Performance Analysis
    print(`\n=== QUERY PERFORMANCE for ${dbName}.${collectionName} ===`);
    
    // Try various fields that might indicate remote jobs
    const remoteFields = ['remote', 'isRemote', 'is_remote', 'jobType', 'job_type', 'employmentType', 'employment_type'];
    let usedRemoteField = null;
    
    for (const field of remoteFields) {
      if (sampleDoc && field in sampleDoc) {
        usedRemoteField = field;
        break;
      }
    }
    
    if (usedRemoteField) {
      print(`\nExplain typical search query (using ${usedRemoteField} field):`);
      try {
        const explainQuery = {};
        
        // Adjust query based on the field type
        if (typeof sampleDoc[usedRemoteField] === 'boolean') {
          explainQuery[usedRemoteField] = true;
        } else if (usedRemoteField === 'jobType' || usedRemoteField === 'job_type') {
          explainQuery[usedRemoteField] = "remote";
        } else {
          explainQuery[usedRemoteField] = { $exists: true };
        }
        
        const explainResult = currentDb[collectionName].find(explainQuery).limit(10).explain("executionStats");
        printjson(explainResult);
      } catch (err) {
        print(`Error analyzing query performance: ${err.message}`);
      }
    } else {
      print("Could not identify a field related to remote jobs in the sample document");
    }
  
    // Collection size and document count
    print(`\n=== COLLECTION METRICS for ${dbName}.${collectionName} ===`);
    try {
      const docCount = currentDb[collectionName].countDocuments();
      print(`\nTotal Documents: ${docCount}`);
      
      const stats = currentDb[collectionName].stats();
      print(`Collection Size: ${stats.size} bytes`);
      
      if (docCount > 0) {
        print(`Average Document Size: ${stats.size / docCount} bytes`);
      }
    } catch (err) {
      print(`Error getting collection metrics: ${err.message}`);
    }
  
    // Find large arrays in documents
    print(`\n=== POTENTIAL ISSUES for ${dbName}.${collectionName} ===`);
    print("\nSearching for documents with large arrays:");
    
    try {
      // Get a sample of documents
      const sampleDocs = currentDb[collectionName].find().limit(100).toArray();
      
      // Track arrays and their sizes
      const arrayFields = {};
      
      sampleDocs.forEach(doc => {
        Object.entries(doc).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 10) {
            if (!arrayFields[key]) {
              arrayFields[key] = { 
                maxSize: 0,
                avgSize: 0,
                count: 0,
                totalSize: 0
              };
            }
            
            arrayFields[key].count++;
            arrayFields[key].totalSize += value.length;
            arrayFields[key].maxSize = Math.max(arrayFields[key].maxSize, value.length);
          }
        });
      });
      
      // Calculate averages
      Object.keys(arrayFields).forEach(field => {
        arrayFields[field].avgSize = arrayFields[field].totalSize / arrayFields[field].count;
      });
      
      if (Object.keys(arrayFields).length > 0) {
        print("Large array fields found:");
        Object.entries(arrayFields).forEach(([field, stats]) => {
          printjson({ 
            field, 
            maxSize: stats.maxSize, 
            avgSize: stats.avgSize, 
            occurrences: stats.count 
          });
        });
      } else {
        print("No large array fields found (>10 elements)");
      }
    } catch (err) {
      print(`Error analyzing large arrays: ${err.message}`);
    }
  } catch (err) {
    print(`Error analyzing database ${dbName}: ${err.message}`);
  }
}); 