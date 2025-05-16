# MongoDB Optimization Recommendations for ClickClickJob.com

## Executive Summary

Based on the diagnostic analysis of your MongoDB databases, I've identified several opportunities for optimization:

1. **Missing Indexes**: All databases lack proper indexes for common query patterns
2. **No TTL Indexes**: No TTL indexes are configured for job expiration
3. **Inconsistent Schema**: Field names and types vary across collections
4. **Full Collection Scans**: Queries are using inefficient COLLSCAN operations
5. **Schema Improvements**: Several structural improvements can enhance performance

## Detailed Findings and Recommendations

### 1. Indexing Strategy

**Current State:**
- Most collections only have the default `_id` index
- `remote-jobs.jobs` has a simple index on `title` field
- All queries scanning entire collections (`COLLSCAN`) instead of using indexes

**Recommendations:**

```javascript
// For clickclickjob.jobs - Create compound index for common search patterns
db.jobs.createIndex({ 
  jobType: 1, 
  remote: 1, 
  postedDate: -1 
}, { background: true });

// For remote filtering and sorting by recency
db.jobs.createIndex({ 
  remote: 1, 
  postedDate: -1 
}, { background: true });

// For salary-based filtering and sorting
db.jobs.createIndex({ 
  remote: 1, 
  salary: 1 
}, { background: true });

// For remote-jobs.jobs - Similar indexes with their schema
db.jobs.createIndex({ 
  isRemote: 1, 
  postedDate: -1 
}, { background: true });

// For test.jobs
db.jobs.createIndex({ 
  isRemote: 1, 
  qualityScore: -1, 
  postedDate: -1 
}, { background: true });
```

### 2. TTL Indexes for Job Expiration

**Current State:**
- No TTL indexes on any collection
- All collections have date fields that could be used for TTL expiration

**Recommendations:**

```javascript
// For clickclickjob.jobs - Automatically expire jobs older than 90 days
db.jobs.createIndex({ 
  postedDate: 1 
}, { 
  expireAfterSeconds: 7776000,  // 90 days in seconds
  background: true 
});

// For remote-jobs.jobs - Using their expiresAt field
db.jobs.createIndex({ 
  expiresAt: 1 
}, { 
  expireAfterSeconds: 0,  // Expire immediately once expiresAt date is reached
  background: true 
});

// For test.jobs
db.jobs.createIndex({ 
  postedDate: 1 
}, { 
  expireAfterSeconds: 7776000, 
  background: true 
});
```

### 3. Schema Standardization

**Current State:**
- Inconsistent field naming (`remote` vs `isRemote`)
- Different date field names (`postedDate`, `createdAt`, etc.)
- Schema varies across different collections

**Recommendations:**

1. Standardize field names across collections:
   - Use consistent boolean naming (`isRemote` instead of `remote`)
   - Standardize date field names (`postedDate`, `createdAt`, `updatedAt`, `expiresAt`)
   - Use consistent casing style (camelCase preferred)

2. Add a schema validator to enforce consistency:

```javascript
db.runCommand({
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
        salary: {
          oneOf: [
            { bsonType: "int" },
            { bsonType: "double" },
            { bsonType: "string" }
          ],
          description: "can be numeric or string (for ranges)"
        },
        isRemote: {
          bsonType: "bool",
          description: "must be a boolean and is required"
        },
        postedDate: {
          bsonType: "date",
          description: "must be a date and is required"
        },
        // Add other fields as needed
      }
    }
  },
  validationLevel: "moderate",
  validationAction: "warn"  // Start with warnings before enforcing
});
```

### 4. Query Optimization

**Current State:**
- Queries for remote jobs use full collection scans
- No evidence of query projection to limit returned fields
- No sorting indexes for common sorting patterns

**Recommendations:**

1. Update application queries to use projections:

```javascript
// Instead of
db.jobs.find({ isRemote: true })

// Use projection to reduce data transfer
db.jobs.find(
  { isRemote: true },
  { title: 1, company: 1, location: 1, salary: 1, postedDate: 1 }
)
```

2. Use the proper indexes for sorting:

```javascript
// With the compound index on { isRemote: 1, postedDate: -1 }
// This query will be efficient:
db.jobs.find({ isRemote: true }).sort({ postedDate: -1 })
```

3. For filtered searches, ensure the filters are in the same order as the index:

```javascript
// For this index: { jobType: 1, remote: 1, postedDate: -1 }
// Use this query pattern:
db.jobs.find({ 
  jobType: "data_entry", 
  remote: true 
}).sort({ postedDate: -1 });
```

### 5. Database Consolidation

**Current State:**
- Similar job data spread across three databases
- Inconsistent schema between databases
- Potential duplicate data

**Recommendations:**

1. Consolidate to a single `clickclickjob` database with multiple collections:
   - `jobs` - Main collection for all jobs
   - `jobs_archive` - For historical/expired jobs
   - `sources` - For tracking job sources
   - `metrics` - For analytics

2. Create a migration plan:
   ```javascript
   // Simplified example:
   db.getSiblingDB("remote-jobs").jobs.find().forEach(function(doc) {
     // Transform document to match target schema
     doc.isRemote = true;  // Ensure consistent field names
     db.getSiblingDB("clickclickjob").jobs.insertOne(doc);
   });
   ```

### 6. Performance Monitoring

**Current State:**
- No evidence of performance monitoring
- No slow query logging

**Recommendations:**

1. Enable Database Profiler:

```javascript
// Set profiling level to log slow queries
db.setProfilingLevel(1, { slowms: 100 });

// Check profiling status
db.getProfilingStatus();
```

2. Create a log rotation policy for the system.profile collection:

```javascript
// Create a TTL index on the profile collection to auto-expire old entries
db.system.profile.createIndex(
  { ts: 1 },
  { expireAfterSeconds: 604800 }  // Keep for 7 days
);
```

## Implementation Priority

1. **Immediate Actions**:
   - Create indexes for common query patterns
   - Implement TTL indexes for automatic expiration

2. **Short-term Actions**:
   - Enable query profiling
   - Start schema normalization for new documents

3. **Medium-term Actions**:
   - Database consolidation
   - Full schema migration
   - Validator implementation

## Monitoring and Validation

After implementing these changes, monitor:

1. Index usage with `db.jobs.aggregate([{$indexStats:{}}])`
2. Query performance with `explain()`
3. MongoDB logs for slow queries
4. Server resource utilization (CPU, memory, disk I/O)

Regular reviews of these metrics will help validate the effectiveness of these optimizations. 