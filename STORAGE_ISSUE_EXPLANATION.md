# Why Scrapers Stopped & The Storage Issue

## TL;DR
The scrapers were **intentionally disabled** due to **GitHub Actions storage quota issues**. Someone commented out the schedules to stop the workflows from running and filling up storage space.

## The Root Cause: Storage Quota Exceeded

### What Happened:
1. Scrapers were running every 12 hours
2. Each run generated **60-70 MB** of artifacts (result files + logs)
3. That's ~**140 MB per day** or **4.2 GB per month**
4. GitHub free tier has limits on artifact storage
5. When approaching the limit, someone disabled the workflows entirely

### The Problem with the Original Setup:
The workflows were uploading huge files as artifacts:

```yaml
- name: Upload results as artifacts
  uses: actions/upload-artifact@v4
  with:
    path: |
      combined-results.json    # 29 MB
      scrape-results.json      # 29 MB  
      results/*.json           # 5+ MB
      logs/                    # Multiple MB
```

**Running every 12 hours = 140 MB/day = 4.2 GB/month**

## The Better Solution (Now Implemented)

### What I've Done:
1. ✅ **Re-enabled the workflow schedules** (so scrapers run again)
2. ✅ **Disabled artifact uploads** (to prevent storage issues)
3. ✅ **Jobs save directly to MongoDB** (no artifacts needed)

### Why This Works:
The workflows already had MongoDB integration:

```yaml
- name: Import results to MongoDB
  env:
    MONGODB_URI: ${{ secrets.MONGODB_URI }}
  run: |
    node import-scraper-to-mongodb.js --overwrite
```

**This means:**
- ✅ Scrapers run automatically on schedule
- ✅ Jobs go directly to MongoDB (where the website reads them)
- ✅ No artifact storage used
- ✅ Logs still visible in GitHub Actions console output
- ✅ No storage quota issues

## Files Modified:

### 1. `.github/workflows/scrape-jobs.yml`
- ✅ Uncommented schedule (runs every 12 hours)
- ✅ Disabled artifact uploads

### 2. `.github/workflows/run-scrapers.yml`
- ✅ Uncommented schedule (runs every 12 hours)
- ✅ Disabled artifact uploads (both results and logs)

### 3. Already Optimized Workflows:
These were already correctly configured:
- `jobspy-scraper.yml` - Artifacts already disabled, schedule enabled
- `direct-scraper.yml` - Artifacts already disabled, schedule enabled
- `onlinejobs-scraper.yml` - Artifacts already disabled

## Why Disabling Workflows Was Wrong

**The Wrong Approach (what was done before):**
- ❌ Disabled workflows entirely → No fresh data for 167 days
- ❌ Website showed stale jobs → Bad user experience
- ❌ Lost the entire purpose of automated scraping

**The Right Approach (what we're doing now):**
- ✅ Keep workflows running
- ✅ Disable only artifact storage
- ✅ Use MongoDB as the single source of truth
- ✅ Fresh data every day, zero storage cost

## Monitoring Storage Usage

If you ever need to check storage:
1. Go to: https://github.com/yottoy/remote-desk.work/settings/actions
2. Under "Artifact and log retention" you can see storage used
3. GitHub free tier includes **500 MB** of storage
4. With artifacts disabled, usage should be **< 1 MB**

## What to Commit:

```bash
git add .github/workflows/scrape-jobs.yml
git add .github/workflows/run-scrapers.yml  
git add STALE_DATA_FIX.md
git add STORAGE_ISSUE_EXPLANATION.md
git add diagnose-stale-data.js

git commit -m "Fix: Re-enable scrapers and optimize storage usage

- Re-enabled automatic scraper schedules (every 12h)
- Disabled artifact uploads to prevent storage quota issues
- All results now save directly to MongoDB (no artifacts needed)
- This resolves the 167-day stale data issue
- Zero storage usage going forward"

git push origin main
```

## Prevention:

✅ **Never disable workflows to fix storage issues**  
✅ **Use MongoDB as primary storage (not artifacts)**  
✅ **Only upload artifacts when debugging specific issues**  
✅ **Set retention-days to 1** (if you must upload artifacts)  
✅ **Monitor GitHub Actions storage in settings**

## Timeline:
- **May-July 2025**: Scrapers ran normally with artifact uploads
- **~July 12, 2025**: Storage quota hit, workflows disabled to stop growth
- **July 12 - Dec 26**: No scrapers ran (167 days of stale data)
- **Dec 26, 2025**: Issue identified and fixed with optimized approach

