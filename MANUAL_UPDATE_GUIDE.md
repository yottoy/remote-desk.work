# Manual Job Update Guide

## Quick Start - One Command

To update your job listings, simply run:

```bash
bash update-jobs.sh
```

This single script will:
1. ✅ Check dependencies
2. ✅ Run the job scraper (fetches fresh jobs)
3. ✅ Clean old MongoDB data
4. ✅ Import fresh jobs to database
5. ✅ Verify the update worked

**Time required**: 5-10 minutes

---

## When to Run It

Run the update script when:
- 🕐 **Weekly** (recommended minimum)
- 📅 **Every 3-4 days** (for best freshness)
- ⚠️ You notice the website showing old jobs
- 🆕 After major job market events

---

## Detailed Instructions

### Option 1: Using the Automated Script (Recommended)

```bash
cd "/Users/yotamtroim/Library/Mobile Documents/com~apple~CloudDocs/Projects/remote-desk.work"
bash update-jobs.sh
```

The script handles everything automatically!

### Option 2: Manual Step-by-Step

If you prefer to run each step individually:

```bash
cd "/Users/yotamtroim/Library/Mobile Documents/com~apple~CloudDocs/Projects/remote-desk.work"

# Step 1: Run scraper
python3 direct_scraper.py

# Step 2: Clean old MongoDB data
node clean-and-import.js

# Step 3: Import fresh data
node import-scraper.js

# Step 4: Verify
node diagnose-stale-data.js
```

---

## Automated MongoDB Cleanup

To keep your MongoDB database under the 512 MB free tier limit:

### Clean Up Old Jobs (45+ days)

```bash
node cleanup-old-jobs.js
```

This will:
- Delete jobs older than 45 days
- Keep your database size manageable
- Prevent quota issues

### Configure Retention Period

Edit `cleanup-old-jobs.js` and change:
```javascript
const MAX_AGE_DAYS = 45;  // Change this number
```

Common settings:
- `30` - Keep last month only (very aggressive)
- `45` - Keep last 6 weeks (recommended)
- `60` - Keep last 2 months
- `90` - Keep last 3 months

---

## Scheduling Automatic Updates (Mac)

Since GitHub Actions isn't working, you can use your Mac's built-in scheduler:

### Using cron (runs even when Mac is asleep)

```bash
# Open cron editor
crontab -e

# Add this line (runs every Monday at 9 AM):
0 9 * * 1 cd "/Users/yotamtroim/Library/Mobile Documents/com~apple~CloudDocs/Projects/remote-desk.work" && bash update-jobs.sh >> logs/cron-$(date +\%Y\%m\%d).log 2>&1

# Or run every 3 days at 9 AM:
0 9 */3 * * cd "/Users/yotamtroim/Library/Mobile Documents/com~apple~CloudDocs/Projects/remote-desk.work" && bash update-jobs.sh >> logs/cron-$(date +\%Y\%m\%d).log 2>&1
```

### Using launchd (Mac's preferred method)

Create a file: `~/Library/LaunchAgents/com.clickclickjob.update.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.clickclickjob.update</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/yotamtroim/Library/Mobile Documents/com~apple~CloudDocs/Projects/remote-desk.work/update-jobs.sh</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
        <key>Weekday</key>
        <integer>1</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/yotamtroim/Library/Mobile Documents/com~apple~CloudDocs/Projects/remote-desk.work/logs/launchd.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/yotamtroim/Library/Mobile Documents/com~apple~CloudDocs/Projects/remote-desk.work/logs/launchd-error.log</string>
</dict>
</plist>
```

Then load it:
```bash
launchctl load ~/Library/LaunchAgents/com.clickclickjob.update.plist
```

---

## Troubleshooting

### "MongoDB quota exceeded"

**Problem**: Database is full (512 MB limit)

**Solution**:
```bash
# Option 1: Clean old jobs
node cleanup-old-jobs.js

# Option 2: Upgrade MongoDB to paid tier
# Go to https://cloud.mongodb.com
# Upgrade to M2 ($9/month, 2GB storage)
```

### "No jobs found"

**Problem**: Scraper couldn't fetch jobs

**Possible causes**:
- Internet connection issue
- Job sites blocking requests
- Scraper needs updating

**Solution**:
```bash
# Check logs
cat logs/manual-run-*.log | tail -100

# Try running scraper again in an hour
```

### "Python packages not found"

**Problem**: Dependencies not installed

**Solution**:
```bash
python3 -m pip install python-jobspy pandas beautifulsoup4 markdownify
```

---

## Files Created by This Guide

- `update-jobs.sh` - Main automation script
- `cleanup-old-jobs.js` - MongoDB cleanup utility
- `clean-and-import.js` - Pre-import cleanup (already exists)
- `diagnose-stale-data.js` - Data freshness checker (already exists)

---

## What Gets Updated

When you run `update-jobs.sh`:

1. **Fresh jobs scraped from**:
   - Indeed
   - LinkedIn
   - WeWorkRemotely (via RSS)

2. **Database updated**:
   - Old stale jobs removed
   - Fresh jobs added
   - Duplicates eliminated

3. **Website automatically shows**:
   - Current job listings
   - Recent posting dates
   - Relevant opportunities

---

## Monitoring Data Freshness

Check if your data is fresh:

```bash
node diagnose-stale-data.js
```

Look for:
- ✅ "Jobs in last 24 hours: > 0"
- ✅ "Most recent job: 0 days ago"
- ❌ "NO JOBS ADDED IN LAST 24 HOURS" → Time to run update

---

**Last Updated**: December 27, 2025  
**Status**: GitHub Actions broken, manual updates required






