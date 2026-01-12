# Stale Data Fix - December 26, 2025

## Problem Identified
Data on the website (clickclickjob.com) is **167 days old** (last updated July 12, 2025).

## Root Cause
GitHub Actions workflows had their schedules **commented out** to reduce artifact storage usage. This meant the scrapers were not running automatically.

## Investigation Results

### Database Status
- **Total jobs in database**: 2,131
- **Most recent job**: July 12, 2025 (167 days old)
- **Jobs added in last 24 hours**: 0
- **Jobs added in last 7 days**: 0

### Workflow Status
Four scraper workflows exist:
1. ✅ `jobspy-scraper.yml` - Schedule ENABLED (runs daily at 2 AM UTC)
2. ✅ `direct-scraper.yml` - Schedule ENABLED (runs daily at 10 AM UTC)
3. ❌ `scrape-jobs.yml` - Schedule was DISABLED (now fixed)
4. ❌ `run-scrapers.yml` - Schedule was DISABLED (now fixed)

## Fixes Applied

### 1. Re-enabled scrape-jobs.yml schedule
```yaml
on:
  schedule:
    - cron: '0 */12 * * *'  # Run every 12 hours
  workflow_dispatch:  # Allow manual runs
```

### 2. Re-enabled run-scrapers.yml schedule
```yaml
on:
  workflow_dispatch:
  schedule:
    - cron: '0 */12 * * *'  # Run every 12 hours
```

## Scraper Schedule Summary
After fixes:
- **JobSpy Scraper**: Daily at 2 AM UTC
- **Direct Scraper**: Daily at 10 AM UTC
- **Scrape Jobs**: Every 12 hours
- **Run Scrapers**: Every 12 hours

## Next Steps

### Immediate Actions Needed
1. ✅ Commit and push the workflow fixes
2. ⚠️  Manually trigger one workflow to test immediately:
   - Go to: https://github.com/yottoy/remote-desk.work/actions
   - Select "JobSpy Scraper" or "Main Job Scraper"
   - Click "Run workflow"
   - Wait for completion and check logs

### Verify These Settings in GitHub
1. **GitHub Actions are enabled**:
   - Repository Settings → Actions → General
   - Ensure "Allow all actions and reusable workflows" is selected

2. **GitHub Secrets are set**:
   - Repository Settings → Secrets and variables → Actions
   - Required secrets:
     - `MONGODB_URI` (must be set and valid)
     - `MONGODB_DB` (should be "clickclickjob")

3. **MongoDB Atlas Network Access**:
   - MongoDB Atlas → Network Access
   - Must allow `0.0.0.0/0` (all IPs) for GitHub Actions runners
   - Or whitelist GitHub Actions IP ranges

### Monitoring
After the first successful workflow run:
1. Run `node diagnose-stale-data.js` to verify new jobs are added
2. Check the website to ensure jobs appear
3. Monitor for next scheduled run

## Expected Timeline
- **First automatic run**: Next scheduled time after commit
  - JobSpy Scraper: 2 AM UTC
  - Direct Scraper: 10 AM UTC
  - Others: Every 12 hours
- **Data refresh on site**: Within 1-2 hours after successful scraper run

## Technical Details

### How the System Works
1. **GitHub Actions** run the scraper workflows on schedule
2. **Scrapers** (Python/Node.js) fetch jobs from Indeed, LinkedIn, WeWorkRemotely, etc.
3. **Results** are saved to `results/combined-results.json`
4. **Import script** (`import-scraper-to-mongodb.js`) uploads jobs to MongoDB
5. **Frontend API** (`/api/jobs`) reads from MongoDB
6. **Website** displays the jobs

### Diagnostic Command
To check data freshness at any time:
```bash
node diagnose-stale-data.js
```

## Files Modified
- `.github/workflows/scrape-jobs.yml` - Uncommented schedule
- `.github/workflows/run-scrapers.yml` - Uncommented schedule
- `diagnose-stale-data.js` - Created diagnostic tool

## Prevention
To avoid this in the future:
1. Don't disable workflow schedules without a replacement strategy
2. Set up monitoring/alerts for stale data
3. Regularly check the Actions tab for failed workflows
4. Run `diagnose-stale-data.js` monthly to verify system health


