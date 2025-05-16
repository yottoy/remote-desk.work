// List all databases
print("\n=== DATABASES ===");
const dbs = db.adminCommand('listDatabases');
printjson(dbs);

// For each database, list collections
dbs.databases.forEach(database => {
  const dbName = database.name;
  if (dbName !== 'admin' && dbName !== 'local' && dbName !== 'config') {
    print(`\n=== COLLECTIONS IN ${dbName} ===`);
    const tempDb = db.getSiblingDB(dbName);
    printjson(tempDb.getCollectionNames());
    
    // For each collection, show one sample document
    tempDb.getCollectionNames().forEach(collName => {
      print(`\n--- Sample document from ${dbName}.${collName} ---`);
      const sample = tempDb[collName].findOne();
      if (sample) {
        printjson(sample);
      } else {
        print("No documents found in this collection.");
      }
    });
  }
}); 