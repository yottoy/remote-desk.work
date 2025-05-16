// Check indexes created for each database
const databases = ['clickclickjob', 'remote-jobs', 'test'];

databases.forEach(dbName => {
  print(`\n=== INDEXES IN ${dbName}.jobs ===`);
  const currentDb = db.getSiblingDB(dbName);
  
  try {
    const indexes = currentDb.jobs.getIndexes();
    printjson(indexes);
  } catch (err) {
    print(`Error retrieving indexes for ${dbName}.jobs: ${err.message}`);
  }
}); 