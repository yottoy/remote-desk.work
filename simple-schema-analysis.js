// Simplified Schema Analysis for ClickClickJob

// Function to analyze schema for a collection
function analyzeSchema(dbName, collectionName) {
  print(`\n=== ANALYZING SCHEMA FOR ${dbName}.${collectionName} ===`);
  
  try {
    const currentDb = db.getSiblingDB(dbName);
    
    // Get a single sample document 
    const sampleDoc = currentDb[collectionName].findOne();
    if (!sampleDoc) {
      print("No documents found to analyze");
      return;
    }
    
    // Show schema fields
    print("\nFields in schema:");
    Object.keys(sampleDoc).forEach(field => {
      const type = Array.isArray(sampleDoc[field]) ? 'array' : 
                  sampleDoc[field] instanceof Date ? 'date' : 
                  sampleDoc[field] instanceof ObjectId ? 'objectId' : 
                  typeof sampleDoc[field];
      
      print(`  - ${field}: ${type}`);
    });
    
    // Count documents
    const count = currentDb[collectionName].countDocuments();
    print(`\nTotal documents: ${count}`);
  } catch (err) {
    print(`Error analyzing schema: ${err.message}`);
  }
}

// Check permissions
function checkPermissions() {
  print("\n=== CHECKING USER PERMISSIONS ===");
  
  try {
    const currentDb = db.getSiblingDB("admin");
    const roles = currentDb.runCommand({ connectionStatus: 1 }).authInfo.authenticatedUserRoles;
    
    print("\nAuthenticated user roles:");
    printjson(roles);
    
    return roles;
  } catch (err) {
    print(`Error checking permissions: ${err.message}`);
    return null;
  }
}

// Generate simple migration plan
function generateSimpleMigrationPlan() {
  print(`\n=== SIMPLIFIED MIGRATION PLAN ===`);
  
  print(`
To implement schema standardization and database consolidation, follow these steps:

1. First, standardize schema fields inside each database:

// For clickclickjob.jobs - Convert 'remote' to 'isRemote'
db.getSiblingDB("clickclickjob").jobs.updateMany(
  { remote: { $exists: true } },
  { $rename: { "remote": "isRemote" } }
);

// For test.jobs - Ensure consistent date field names
db.getSiblingDB("test").jobs.updateMany(
  { postedDate: { $exists: true } },
  [{ $set: { 
      "postedDate": { $ifNull: ["$postedDate", new Date()] },
      "scrapedDate": { $ifNull: ["$scrapedDate", "$createdAt"] }
  } }]
);

2. Migrate data to clickclickjob (target database):

// First create an archive collection for older jobs
db.getSiblingDB("clickclickjob").createCollection("jobs_archive");

// Create the same indexes on the archive collection
db.getSiblingDB("clickclickjob").jobs.getIndexes().forEach(function(idx) {
  if(idx.name !== "_id_") {
    db.getSiblingDB("clickclickjob").jobs_archive.createIndex(
      idx.key, 
      { name: idx.name, background: true }
    );
  }
});

// Migrate data from remote-jobs
db.getSiblingDB("remote-jobs").jobs.find().forEach(function(doc) {
  // Add isRemote field if missing
  if (!doc.isRemote) doc.isRemote = true;
  
  // Add source field if missing
  if (!doc.source) doc.source = "remote-jobs-migration";
  
  db.getSiblingDB("clickclickjob").jobs.insertOne(doc);
});

// Migrate data from test
db.getSiblingDB("test").jobs.find().forEach(function(doc) {
  // Add isRemote field if it doesn't exist
  if (!("isRemote" in doc)) doc.isRemote = doc.isRemote || false;
  
  db.getSiblingDB("clickclickjob").jobs.insertOne(doc);
});

3. Add schema validation to the target collection:

db.getSiblingDB("clickclickjob").runCommand({
  collMod: "jobs",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "company", "description", "isRemote"],
      properties: {
        title: { bsonType: "string" },
        company: { bsonType: "string" },
        description: { bsonType: "string" },
        isRemote: { bsonType: "bool" }
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"
});
`);
}

// Permissions needed for different operations
function listPermissionRequirements() {
  print(`\n=== MONGODB PERMISSIONS REQUIRED ===`);
  
  print(`
To grant the necessary permissions for the MongoDB optimizations, you'll need:

1. For index creation (which you already have):
   - "createIndex" action on the specific collections

2. For profiling (currently denied):
   - "serverStatus" action
   - "setProfile" action on the specific databases
   
3. For schema validation:
   - "collMod" action on the target collections
   
4. For data migration:
   - "find" action on the source collections
   - "insert" action on the target collections

You can request these permissions by asking your MongoDB administrator to grant your user these specific roles:

For a MongoDB Atlas cluster, they can grant:
- The "readWriteAnyDatabase" role for complete access
- Or more specifically: "dbAdmin" role on each database
   
Command to grant these roles:

db.getSiblingDB("admin").grantRolesToUser("yotamt", [
  { role: "dbAdmin", db: "clickclickjob" },
  { role: "dbAdmin", db: "remote-jobs" },
  { role: "dbAdmin", db: "test" }
]);

Or for more restricted access, only the specific actions:

db.getSiblingDB("admin").grantRolesToUser("yotamt", [{
  role: "readWrite", 
  actions: ["createIndex", "find", "insert", "update", "remove"],
  resources: [
    { db: "clickclickjob", collection: "jobs" },
    { db: "remote-jobs", collection: "jobs" },
    { db: "test", collection: "jobs" }
  ]
}]);
`);
}

// Run the analysis
const databases = ['clickclickjob', 'remote-jobs', 'test'];
const collectionName = 'jobs';

databases.forEach(dbName => {
  analyzeSchema(dbName, collectionName);
});

// Check permissions
checkPermissions();

// Generate a simplified migration plan
generateSimpleMigrationPlan();

// List permission requirements
listPermissionRequirements(); 