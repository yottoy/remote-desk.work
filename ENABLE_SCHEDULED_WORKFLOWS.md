# Re-Enable Scheduled GitHub Actions Workflows

## Problem
GitHub Actions automatically disables scheduled workflows after 60 days of repository inactivity. Your workflows stopped running in August 2025.

## Solution

### Method 1: Via GitHub Web Interface (Recommended)

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. In the left sidebar, you'll see a yellow banner saying:
   > "Scheduled workflows have been disabled due to repository inactivity"
4. Click **"Enable workflows"** button

### Method 2: Via GitHub CLI (Faster)

```bash
# Re-enable ALL workflows
gh workflow enable "run-scrapers.yml"
gh workflow enable "scrape-jobs.yml"
gh workflow enable "database-cleanup.yml"

# Or enable all at once
gh workflow enable --all
```

### Method 3: Make a Commit to Trigger Re-activation

Sometimes making any commit will re-activate workflows:

```bash
git commit --allow-empty -m "Re-activate scheduled workflows"
git push origin main
```

## Verify It's Working

After re-enabling, check that scheduled runs resume:

```bash
# Watch for new scheduled runs (not workflow_dispatch)
gh run list --workflow="run-scrapers.yml" --limit 5

# Wait 12 hours and check again - should see a "schedule" trigger
```

## Current Schedule

Once re-enabled, your workflows will run:

- **Job Scrapers** (`run-scrapers.yml`): Every 12 hours at 00:00 and 12:00 UTC
- **Job Scrapers** (`scrape-jobs.yml`): Every 12 hours at 00:00 and 12:00 UTC  
- **Database Cleanup** (`database-cleanup.yml`): Weekly on Sundays at 03:00 UTC

## Prevent Future Disabling

To prevent this from happening again:

1. **Make regular commits** - Even documentation updates count
2. **Set up notifications** - GitHub should email you when workflows are disabled
3. **Monitor the Actions tab** - Check periodically that scheduled runs are happening

## Cleanup Strategy

### Current Setup:
- **Job Scrapers**: Replace ALL jobs on every run (not age-based cleanup)
  - Deletes everything in DB
  - Imports fresh scraped jobs
  - Runs every 12 hours

- **Database Cleanup**: Age-based cleanup (removes jobs older than 60 days)
  - Independent workflow
  - Runs weekly on Sundays at 3 AM UTC
  - Can be run manually with custom parameters

### Recommendation:
Since the scrapers do a **full replacement** every 12 hours, the database cleanup is redundant unless you want to ensure data freshness between scraper runs. Consider:

1. **Keep current setup** if you want double protection
2. **Disable database-cleanup.yml** if the full replacement is sufficient
3. **Change scraper to append** instead of replace if you want historical data

## Quick Test

Run this to confirm your manual run worked:

```bash
node get-current-job-count.js
```

This will show how many jobs are currently in your database after your manual run.
