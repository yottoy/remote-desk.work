# MongoDB Quota Management

## 🚨 The Problem

Your MongoDB free tier has a **512MB storage limit**. When this limit is exceeded:
- Scrapers fail with "you are over your space quota" errors
- New jobs cannot be saved to the database
- Website may show limited or no jobs

## ✅ The Solution

I've implemented a comprehensive quota management system:

### 1. **Automated Weekly Cleanup**
- **Workflow**: `.github/workflows/database-cleanup.yml`
- **Schedule**: Every Sunday at 3 AM UTC
- **Actions**:
  - Removes jobs older than 60 days
  - Deletes duplicate jobs (same URL)
  - Removes empty/invalid jobs
  - Cleans up test/mock data
  - Optimizes database indexes

### 2. **Daily Cleanup Integration**
- **Added to scrapers**: `jobspy-scraper.yml`, `direct-scraper.yml`
- **Runs after each scraping session**
- **Keeps jobs for 45 days max**
- **Prevents gradual quota buildup**

### 3. **Monitoring System**
- **Script**: `scripts/monitor-database-usage.js`
- **Shows**: Current usage, warnings, recommendations
- **Estimates**: Database size and quota percentage

### 4. **Manual Cleanup Tools**
- **Script**: `scripts/periodic-database-cleanup.js`
- **Usage**: `node scripts/periodic-database-cleanup.js [options]`
- **Options**:
  - `--dry-run`: See what would be cleaned
  - `--max-age=30`: Set job retention days

## 📊 Current Status

```bash
# Check current usage
node scripts/monitor-database-usage.js

# Current: 0.03 MB / 512 MB (0.01% usage) ✅
```

## 🛠️ Manual Commands

### Check Database Status
```bash
node scripts/monitor-database-usage.js
```

### Preview Cleanup (Dry Run)
```bash
node scripts/periodic-database-cleanup.js --dry-run
```

### Run Cleanup
```bash
node scripts/periodic-database-cleanup.js
```

### Check Job Count
```bash
node get-current-job-count.js
```

## ⚙️ Configuration

### Cleanup Schedule
- **Weekly cleanup**: Sundays 3 AM UTC
- **Scraper cleanup**: After each scraping run
- **Retention period**: 45-60 days

### GitHub Actions
- **Manual trigger**: Available for immediate cleanup
- **Dry run option**: Test without making changes
- **Monitoring**: Checks database status after cleanup

## 🚨 Emergency Procedures

### If Quota Exceeded Again:
1. **Immediate cleanup**:
   ```bash
   node scripts/periodic-database-cleanup.js --max-age=30
   ```

2. **Clear test databases**:
   ```bash
   # Clear test database completely
   node -e "
   const { MongoClient } = require('mongodb');
   require('dotenv').config();
   const client = new MongoClient(process.env.MONGODB_URI);
   client.connect().then(() => {
     return client.db('test').collection('jobs').deleteMany({});
   }).then(result => {
     console.log('Deleted', result.deletedCount, 'test jobs');
     return client.close();
   });
   "
   ```

3. **Manual GitHub Action**:
   - Go to Actions → Database Cleanup → Run workflow
   - Set max age to 30 days
   - Run cleanup

### Prevention Tips:
- Monitor weekly via GitHub Actions logs
- Run cleanup if usage > 300MB (~60%)
- Consider upgrading MongoDB plan if consistent high usage

## 📈 Long-term Recommendations

### For Sustained Growth:
1. **Upgrade MongoDB**: Consider paid plan (2GB+ storage)
2. **Archive old jobs**: Export to external storage
3. **Optimize job data**: Reduce field sizes if possible
4. **Database sharding**: Split by date or source

### Monitoring Alerts:
- Set up alerts when usage > 70%
- Monitor failed scraper runs
- Track cleanup effectiveness

## 🎯 Expected Benefits

- **Prevents quota issues**: Automatic cleanup before limits
- **Maintains performance**: Regular database optimization  
- **Reduces manual work**: Automated monitoring and cleanup
- **Preserves recent jobs**: Smart retention policies
- **Emergency recovery**: Tools for quick quota relief

Your quota management system is now **fully automated** and should prevent future storage issues! 🚀 