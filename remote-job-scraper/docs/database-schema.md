# Database Schema Documentation

This document describes the MongoDB schema used in the Remote Job Scraper project.

## Job Collection

The main collection for storing job listings.

### Schema Fields

| Field                | Type      | Description                                 | Indexed |
|----------------------|-----------|---------------------------------------------|---------|
| title                | String    | Job title                                   | Yes     |
| company              | String    | Company name                                | Yes     |
| location             | String    | Job location (defaults to "Remote")         | No      |
| description          | String    | Full HTML job description                   | No      |
| descriptionText      | String    | Plain text job description                  | Yes (text) |
| url                  | String    | Job listing URL                             | Yes (unique) |
| salary               | String    | Salary information if available             | No      |
| postedDate           | Date      | Date job was posted                         | Yes     |
| scrapedDate          | Date      | Date job was scraped                        | Yes     |
| expiresAt            | Date      | Date job listing expires                    | Yes (TTL) |
| source               | String    | Source of job listing (e.g., "weworkremotely") | Yes     |
| sourceId             | String    | Original ID from source if available        | Sparse  |
| qualityScore         | Number    | Overall quality score (0-10)                | Yes     |
| relevanceScore       | Number    | Relevance to data entry/admin (0-10)        | No      |
| qualityIndicatorScore| Number    | Job listing quality score (0-10)            | No      |
| credibilityScore     | Number    | Source credibility score (0-10)             | No      |
| recencyScore         | Number    | Recency score (0-10)                        | No      |
| featured             | Boolean   | Whether job is featured                     | Yes     |
| tags                 | [String]  | Array of job tags/categories                | Yes     |
| uniqueIdentifier     | String    | Unique identifier for deduplication         | Yes (unique) |
| createdAt            | Date      | Timestamp of document creation              | Yes     |
| updatedAt            | Date      | Timestamp of last update                    | Yes     |

### Indexes

The Job schema includes several indexes for efficient querying:

1. Single field indexes:
   - `title`: 1
   - `company`: 1
   - `url`: 1 (unique)
   - `postedDate`: 1
   - `scrapedDate`: 1
   - `source`: 1
   - `qualityScore`: 1
   - `featured`: 1
   - `uniqueIdentifier`: 1 (unique)

2. Compound indexes:
   - `{ company: 1, title: 1, source: 1 }`: For efficient deduplication

3. TTL index:
   - `{ expiresAt: 1 }`: Automatically removes expired job listings

4. Text index:
   - `{ title: 'text', company: 'text', descriptionText: 'text' }`: For text search capabilities

### Usage Examples

#### Querying featured jobs:

```javascript
db.jobs.find({ featured: true }).sort({ qualityScore: -1 }).limit(10);
```

#### Finding recent data entry jobs:

```javascript
db.jobs.find({
  title: { $regex: /data entry/i },
  postedDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
}).sort({ postedDate: -1 });
```

#### Text search for admin positions:

```javascript
db.jobs.find(
  { $text: { $search: "administrative assistant virtual" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } });
```

## Planned Database Optimizations

1. **Sharding Strategy**: For future scale, we may shard the collection by source and postedDate to distribute the data.

2. **Capped Collections**: We may use capped collections for logs to prevent unbounded growth.

3. **Change Streams**: We could implement change streams to track updates to job listings in real time.

4. **Read/Write Separation**: As the system grows, we could implement separate read and write connections to optimize performance. 