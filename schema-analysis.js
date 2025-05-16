// Schema Analysis and Consolidation Planning for ClickClickJob
//
// This script analyzes the different schemas across databases
// and prepares for schema consolidation

// Define standard field mappings
const standardFieldMappings = {
  // Boolean fields
  'remote': 'isRemote',
  'is_remote': 'isRemote',
  
  // Date fields
  'posted_date': 'postedDate',
  'scraped_date': 'scrapedDate',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  
  // Common fields
  'job_type': 'jobType',
  'employment_type': 'employmentType',
  'experience_level': 'experienceLevel'
};

// Define expected fields for standardized schema
const standardFields = [
  "title", "company", "description", "location", "salary",
  "postedDate", "jobType", "experienceLevel", "employmentType",
  "skills", "isRemote", "url", "credibilityScore", "qualityScore",
  "source", "scrapedDate", "tags"
];

// Function to analyze schema for a collection
function analyzeSchema(dbName, collectionName) {
  print(`\n=== ANALYZING SCHEMA FOR ${dbName}.${collectionName} ===`);
  
  try {
    const currentDb = db.getSiblingDB(dbName);
    
    // Get a sample of documents
    const sampleDocs = currentDb[collectionName].find().limit(100).toArray();
    if (sampleDocs.length === 0) {
      print("No documents found to analyze");
      return null;
    }
    
    print(`Analyzing ${sampleDocs.length} sample documents`);
    
    // Collect all field names across all documents
    const allFields = new Set();
    const fieldTypes = {};
    const fieldCounts = {};
    const fieldExamples = {};
    
    sampleDocs.forEach(doc => {
      Object.entries(doc).forEach(([field, value]) => {
        // Add to set of all fields
        allFields.add(field);
        
        // Count field occurrences
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
        
        // Collect field types
        const type = Array.isArray(value) ? 'array' : 
                    value instanceof Date ? 'date' : 
                    value instanceof ObjectId ? 'objectId' : 
                    typeof value;
        
        if (!fieldTypes[field]) {
          fieldTypes[field] = new Set();
        }
        fieldTypes[field].add(type);
        
        // Keep an example value (non-empty if possible)
        if (!fieldExamples[field] || 
            (fieldExamples[field] === null && value !== null) ||
            (fieldExamples[field] === "" && value !== "")) {
          fieldExamples[field] = value;
        }
      });
    });
    
    // Convert Sets to Arrays for output
    const fieldTypesOutput = {};
    Object.entries(fieldTypes).forEach(([field, types]) => {
      fieldTypesOutput[field] = Array.from(types);
    });
    
    // Calculate field frequencies
    const fieldFrequencies = {};
    Object.entries(fieldCounts).forEach(([field, count]) => {
      fieldFrequencies[field] = count / sampleDocs.length;
    });
    
    // Identify fields that need standardization
    const fieldsToStandardize = [];
    allFields.forEach(field => {
      const lcField = field.toLowerCase();
      for (const [oldName, newName] of Object.entries(standardFieldMappings)) {
        if (lcField === oldName.toLowerCase() && field !== newName) {
          fieldsToStandardize.push({
            from: field,
            to: newName,
            frequency: fieldFrequencies[field]
          });
          break;
        }
      }
    });
    
    // Identify missing standard fields
    const missingFields = standardFields.filter(
      stdField => !Array.from(allFields).some(
        field => field.toLowerCase() === stdField.toLowerCase()
      )
    );
    
    // Return analysis results
    const results = {
      database: dbName,
      collection: collectionName,
      documentCount: sampleDocs.length,
      allFields: Array.from(allFields),
      fieldTypes: fieldTypesOutput,
      fieldFrequencies,
      fieldsToStandardize,
      missingFields,
      fieldExamples
    };
    
    // Print summary
    print(`Found ${results.allFields.length} unique fields`);
    print(`\nFields to standardize:`);
    if (results.fieldsToStandardize.length > 0) {
      results.fieldsToStandardize.forEach(field => {
        print(`  - ${field.from} -> ${field.to} (${Math.round(field.frequency * 100)}% of docs)`);
      });
    } else {
      print("  None found");
    }
    
    print(`\nMissing standard fields:`);
    if (results.missingFields.length > 0) {
      results.missingFields.forEach(field => {
        print(`  - ${field}`);
      });
    } else {
      print("  None missing");
    }
    
    return results;
  } catch (err) {
    print(`Error analyzing schema: ${err.message}`);
    return null;
  }
}

// Generate migration commands
function generateMigrationPlan(analyses) {
  print("\n=== SCHEMA MIGRATION PLAN ===");
  
  // Target database for consolidation
  const targetDb = "clickclickjob";
  print(`Target database: ${targetDb}`);
  
  // For each source database
  analyses.forEach(analysis => {
    if (!analysis) return;
    
    const sourceDb = analysis.database;
    
    // Skip if it's the target database
    if (sourceDb === targetDb) {
      print(`\nSource ${sourceDb} is the target database - only schema standardization needed`);
      return;
    }
    
    print(`\nMigration from ${sourceDb} to ${targetDb}:`);
    
    // Generate update operations for field standardization
    print(`1. Field standardization updates for ${sourceDb}:`);
    
    if (analysis.fieldsToStandardize.length > 0) {
      analysis.fieldsToStandardize.forEach(field => {
        print(`   db.getSiblingDB("${sourceDb}").${analysis.collection}.updateMany(
     { ${field.from}: { $exists: true } },
     { $rename: { "${field.from}": "${field.to}" } }
   );`);
      });
    } else {
      print("   No field updates needed");
    }
    
    // Generate migration command
    print(`\n2. Data migration command:`);
    print(`   db.getSiblingDB("${sourceDb}").${analysis.collection}.find().forEach(function(doc) {
     // Add any missing fields with default values
     ${analysis.missingFields.map(field => {
       // Generate sensible defaults based on field name
       let defaultValue = "null";
       if (field.toLowerCase().includes("date")) {
         defaultValue = "new Date()";
       } else if (field.toLowerCase().includes("score")) {
         defaultValue = "5";
       } else if (field.toLowerCase().includes("remote") || field.toLowerCase().startsWith("is")) {
         defaultValue = "false";
       } else if (field.toLowerCase().includes("skills") || field.toLowerCase().includes("tags")) {
         defaultValue = "[]";
       }
       return `if (!("${field}" in doc)) doc.${field} = ${defaultValue};`;
     }).join("\n     ")}
     
     // Insert into target collection
     db.getSiblingDB("${targetDb}").${analysis.collection}.insertOne(doc);
   });`);
  });
  
  // Generate schema validator
  print(`\n3. Schema validator for ${targetDb}:`);
  print(`db.runCommand({
  collMod: "jobs",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "company", "description", "postedDate", "isRemote"],
      properties: {
        title: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        company: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        description: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        postedDate: {
          bsonType: "date",
          description: "must be a date and is required"
        },
        isRemote: {
          bsonType: "bool",
          description: "must be a boolean and is required"
        }
        // Add other fields as needed
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});`);
  
  print("\n=== MIGRATION PLAN GENERATED ===");
}

// Run analysis for each database
const databases = ['clickclickjob', 'remote-jobs', 'test'];
const collectionName = 'jobs';

const analyses = databases.map(dbName => {
  return analyzeSchema(dbName, collectionName);
});

// Generate migration plan
generateMigrationPlan(analyses); 