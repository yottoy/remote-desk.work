// MongoDB Optimization Implementation Script for ClickClickJob.com
//
// Execute this script using:
// mongosh "mongodb+srv://cluster0.mjemntb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" --username yotamt --file apply-mongo-optimizations.js
//
// This script implements the critical performance optimizations:
// 1. Creates appropriate indexes for common query patterns
// 2. Sets up TTL indexes for automatic job expiration
// 3. Enables query performance profiling

// Function to safely create indexes
function createIndexSafely(db, collection, indexSpec, options) {
  try {
    print(`Creating index on ${db}.${collection}: ${JSON.stringify(indexSpec)}`);
    const result = db[collection].createIndex(indexSpec, options);
    print(`Index created successfully: ${JSON.stringify(result)}`);
    return true;
  } catch (err) {
    print(`Error creating index on ${db}.${collection}: ${err.message}`);
    return false;
  }
}

// Function to enable profiling on a database
function enableProfiling(db, slowMs = 100) {
  try {
    print(`Enabling profiling on ${db.getName()} for queries slower than ${slowMs}ms`);
    const result = db.setProfilingLevel(1, { slowms: slowMs });
    print(`Profiling enabled: ${JSON.stringify(result)}`);
    return true;
  } catch (err) {
    print(`Error enabling profiling on ${db.getName()}: ${err.message}`);
    return false;
  }
}

// Optimize clickclickjob database
print("\n=== Optimizing clickclickjob database ===");
let db = db.getSiblingDB("clickclickjob");

// Create indexes for common query patterns
createIndexSafely(db, "jobs", { jobType: 1, remote: 1, postedDate: -1 }, { background: true });
createIndexSafely(db, "jobs", { remote: 1, postedDate: -1 }, { background: true });
createIndexSafely(db, "jobs", { remote: 1, salary: 1 }, { background: true });

// Create TTL index for job expiration
createIndexSafely(db, "jobs", { postedDate: 1 }, { 
  expireAfterSeconds: 7776000,  // 90 days
  background: true 
});

// Enable profiling
enableProfiling(db);

// Optimize remote-jobs database
print("\n=== Optimizing remote-jobs database ===");
db = db.getSiblingDB("remote-jobs");

// Create indexes for common query patterns
createIndexSafely(db, "jobs", { featured: 1, postedDate: -1 }, { background: true });
createIndexSafely(db, "jobs", { source: 1, postedDate: -1 }, { background: true });
createIndexSafely(db, "jobs", { credibilityScore: -1, postedDate: -1 }, { background: true });

// Create TTL index for job expiration using expiresAt field
createIndexSafely(db, "jobs", { expiresAt: 1 }, { 
  expireAfterSeconds: 0,  // Expire when expiresAt is reached
  background: true 
});

// Enable profiling
enableProfiling(db);

// Optimize test database
print("\n=== Optimizing test database ===");
db = db.getSiblingDB("test");

// Create indexes for common query patterns
createIndexSafely(db, "jobs", { isRemote: 1, postedDate: -1 }, { background: true });
createIndexSafely(db, "jobs", { source: 1, isRemote: 1 }, { background: true });
createIndexSafely(db, "jobs", { qualityScore: -1, isRemote: 1 }, { background: true });

// Create TTL index for job expiration
createIndexSafely(db, "jobs", { postedDate: 1 }, { 
  expireAfterSeconds: 7776000,  // 90 days
  background: true 
});

// Enable profiling
enableProfiling(db);

// Add TTL index for all profile collections to auto-expire old profiling data
print("\n=== Setting up profile data auto-cleanup ===");
["clickclickjob", "remote-jobs", "test"].forEach(dbName => {
  try {
    const profDb = db.getSiblingDB(dbName);
    createIndexSafely(profDb, "system.profile", { ts: 1 }, { 
      expireAfterSeconds: 604800  // 7 days
    });
  } catch (err) {
    print(`Could not set TTL on profile collection for ${dbName}: ${err.message}`);
  }
});

print("\n=== Optimization completed ===");
print("To verify the optimizations, run: db.collection.getIndexes()");
print("To check profiling status, run: db.getProfilingStatus()");
print("To view slow queries, run: db.system.profile.find().sort({ts:-1}).limit(10)"); 