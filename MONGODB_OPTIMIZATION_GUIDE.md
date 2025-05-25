# MongoDB Optimization Guide for ClickClickJob.com

This guide provides comprehensive instructions for fixing the MongoDB database organization and optimizing performance for ClickClickJob.com.

## Current Issues

1. **Data Organization Issue**: Job data is incorrectly stored in `test/jobs` collection instead of `clickclickjob/jobs`
2. **Missing Indexes**: Lack of proper indexes for common query patterns causing slow performance
3. **No TTL Indexes**: Missing TTL indexes for automatic job listing expiration
4. **Inconsistent Schema**: Field names and types vary across collections
5. **Inefficient Queries**: Collection scans instead of indexed lookups

## Optimization Scripts

We've created several scripts to diagnose and fix these issues:

1. `mongo-diagnostic.js` - Diagnoses current database structure and performance
2. `migrate-jobs.js` - Migrates job data from test.jobs to clickclickjob.jobs
3. `optimize-indexes.js` - Creates optimized indexes for common queries
4. `validate-schema.js` - Adds schema validation to ensure data consistency

## Step 1: Diagnose the Current State

Run the diagnostic script to understand the current database structure and identify specific issues:

```bash
node mongo-diagnostic.js
```

This will output:
- List of databases and collections
- Document counts in each jobs collection
- Current index configuration
- TTL index status

## Step 2: Migrate Job Data

Migrate the job data from `test.jobs` to `clickclickjob.jobs` with proper schema transformation:

```bash
node migrate-jobs.js
```

This script will:
- Backup existing data in clickclickjob.jobs
- Transform documents to match the target schema
- Handle field mappings and inconsistencies
- Process the migration in batches for better performance
- Report on the migration results

## Step 3: Optimize Indexes

After migration, optimize the database performance by creating proper indexes:

```bash
node optimize-indexes.js
```

This script creates the following indexes:
1. Compound index for job type + remote + recency filtering
2. Index for remote filtering with recency sorting
3. Index for salary-based filtering
4. Index for skills-based searching
5. Index for experience level filtering
6. Index for employment type filtering
7. Text index for keyword searching
8. TTL index for automatic expiration
9. Unique compound index to prevent duplicates

## Step 4: Add Schema Validation

Finally, add schema validation to ensure data consistency:

```bash
node validate-schema.js
```

This script:
- Adds JSON Schema validation to the jobs collection
- Sets validation level to "moderate" (validates new/modified documents)
- Sets validation action to "warn" (logs issues but doesn't reject documents)

## Query Optimization Recommendations

Once you've completed the above steps, optimize your application queries with these patterns:

### 1. Use Projection to Reduce Data Transfer

```javascript
// Instead of returning all fields
db.jobs.find({ remote: true })

// Use projection to return only needed fields
db.jobs.find(
  { remote: true },
  { title: 1, company: 1, salary: 1, postedDate: 1 }
)
```

### 2. Use the Proper Indexes for Sorting

```javascript
// Use the compound index for filtering and sorting
db.jobs.find({ 
  jobType: "data_entry", 
  remote: true 
}).sort({ postedDate: -1 });
```

### 3. Use Text Search Efficiently

```javascript
// Use text search with projection
db.jobs.find(
  { $text: { $search: "excel data entry" }, remote: true },
  { title: 1, company: 1, score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })
```

### 4. Use Aggregation for Complex Operations

```javascript
// Instead of multiple queries, use aggregation
db.jobs.aggregate([
  { $match: { remote: true, jobType: "data_entry" } },
  { $sort: { postedDate: -1 } },
  { $limit: 20 },
  { $project: { 
    title: 1, 
    company: 1, 
    salary: 1,
    postedDate: 1,
    daysSincePosted: { 
      $trunc: { 
        $divide: [
          { $subtract: [new Date(), "$postedDate"] }, 
          86400000 // milliseconds in a day
        ] 
      }
    }
  }}
])
```

## Monitoring Database Performance

After implementing these optimizations, monitor performance with:

```javascript
// Enable profiling for slow queries
db.setProfilingLevel(1, { slowms: 100 });

// Check profiling status
db.getProfilingStatus();

// Review slow operations
db.system.profile.find().sort({ts:-1})
```

## Ongoing Maintenance

Schedule regular maintenance:

1. Verify TTL indexes are working correctly
2. Monitor index size and usage
3. Check for new unindexed queries
4. Validate data consistency
5. Compact and repair database if needed

For any questions or assistance, contact the database engineering team. 