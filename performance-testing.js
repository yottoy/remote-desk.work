// Performance testing script for ClickClickJob MongoDB
//
// This script tests common query patterns to verify index usage and performance

// Function to run a query test with explain() plan
function testQuery(dbName, queryName, query, sort = {}, limit = 10) {
  print(`\n--- Testing query: ${queryName} on ${dbName}.jobs ---`);
  
  try {
    const currentDb = db.getSiblingDB(dbName);
    
    // Time the query execution
    const startTime = new Date();
    const cursor = currentDb.jobs.find(query).sort(sort).limit(limit);
    const count = cursor.itcount();
    const execTime = new Date() - startTime;
    
    print(`Documents found: ${count}`);
    print(`Execution time: ${execTime}ms`);
    
    // Get the explain plan
    const plan = currentDb.jobs.find(query).sort(sort).limit(limit).explain("executionStats");
    
    // Check for index usage
    const stage = plan.executionStats.executionStages;
    const isIndexUsed = !stage.stage.includes("COLLSCAN");
    const indexName = isIndexUsed && stage.inputStage ? stage.inputStage.indexName : "None";
    
    print(`Index used: ${isIndexUsed ? "Yes" : "No"}`);
    print(`Index name: ${indexName}`);
    print(`Documents examined: ${plan.executionStats.totalDocsExamined}`);
    print(`Keys examined: ${plan.executionStats.totalKeysExamined}`);
    print(`Execution time (explain): ${plan.executionStats.executionTimeMillis}ms`);
    
    // Print execution stages summary
    print("Execution plan:");
    printStages(stage, 2);
    
    return {
      isIndexUsed,
      indexName,
      execTime,
      docsExamined: plan.executionStats.totalDocsExamined,
      keysExamined: plan.executionStats.totalKeysExamined,
      nReturned: plan.executionStats.nReturned
    };
  } catch (err) {
    print(`Error testing query: ${err.message}`);
    return null;
  }
}

// Helper function to print execution stages
function printStages(stage, indent) {
  const indentStr = ' '.repeat(indent);
  print(`${indentStr}Stage: ${stage.stage}`);
  
  if (stage.inputStage) {
    printStages(stage.inputStage, indent + 2);
  } else if (stage.inputStages) {
    stage.inputStages.forEach(s => printStages(s, indent + 2));
  }
}

// Run tests on clickclickjob database
print("\n=== TESTING clickclickjob.jobs QUERIES ===");
const db1 = "clickclickjob";

// Test 1: Query by jobType and remote flag with sorting
testQuery(
  db1, 
  "Remote data entry jobs by date",
  { jobType: "data_entry", remote: true },
  { postedDate: -1 }
);

// Test 2: Query by remote flag with salary sorting
testQuery(
  db1,
  "Remote jobs by salary",
  { remote: true },
  { salary: -1 }
);

// Run tests on remote-jobs database
print("\n=== TESTING remote-jobs.jobs QUERIES ===");
const db2 = "remote-jobs";

// Test 3: Featured jobs by date
testQuery(
  db2,
  "Featured jobs by date",
  { featured: true },
  { postedDate: -1 }
);

// Test 4: Jobs by source and credibility
testQuery(
  db2,
  "Jobs by source and credibility",
  { source: "WeWorkRemotelyRss" },
  { credibilityScore: -1, postedDate: -1 }
);

// Run tests on test database
print("\n=== TESTING test.jobs QUERIES ===");
const db3 = "test";

// Test 5: Remote jobs by quality score
testQuery(
  db3,
  "Remote jobs by quality score",
  { isRemote: true },
  { qualityScore: -1 }
);

// Test 6: Jobs from specific source
testQuery(
  db3,
  "Jobs from specific source and remote",
  { source: "JobSpyIndeed", isRemote: true },
  { postedDate: -1 }
);

print("\n=== PERFORMANCE TESTING COMPLETED ==="); 