# Quick Start: Commit and Trigger Workflows

## You need to run these commands manually due to Xcode license agreement

### Step 1: Accept Xcode License (Required First)
```bash
sudo xcodebuild -license
```
- Type your password
- Press Space to scroll through license
- Type "agree" at the end

### Step 2: Commit Changes
```bash
bash commit-changes.sh
```

This will:
- Stage all modified files
- Create a commit with descriptive message
- Push to GitHub

### Step 3: Trigger Workflows

**Option A: Via Script (Requires GitHub Token)**
```bash
# First, create a GitHub Personal Access Token:
# 1. Go to: https://github.com/settings/tokens
# 2. Click "Generate new token (classic)"
# 3. Select scopes: "repo" and "workflow"
# 4. Generate and copy the token

# Then run:
export GITHUB_TOKEN='your_token_here'
bash trigger-workflows.sh
```

**Option B: Via GitHub Web UI (Easier, Recommended)**
1. Go to: https://github.com/yottoy/remote-desk.work/actions

2. **Trigger "JobSpy Scraper" first** (recommended):
   - Click on "JobSpy Scraper" in the left sidebar
   - Click the "Run workflow" dropdown button
   - Click the green "Run workflow" button
   - Wait for it to start (1-2 minutes)

3. **Trigger "Main Job Scraper"**:
   - Click on "Main Job Scraper" 
   - Click "Run workflow" → "Run workflow"

4. **Optionally trigger the others**:
   - "Scrape Remote Admin/Data Entry Jobs"
   - "Run Job Scrapers"

### Step 4: Monitor Progress
Watch the workflows run:
```
https://github.com/yottoy/remote-desk.work/actions
```

Each workflow takes 15-30 minutes. Look for:
- ✅ Green checkmark = Success
- ❌ Red X = Failed (check logs)
- 🟡 Yellow dot = Running

### Step 5: Verify Fresh Data
After the first workflow completes successfully:
```bash
node diagnose-stale-data.js
```

Should show:
- Jobs in last 24 hours: > 0
- Most recent job: < 1 day old

### Step 6: Check Website
Visit: https://clickclickjob.com

Should show fresh, recent job postings!

---

## Files Created
- `commit-changes.sh` - Script to commit changes
- `trigger-workflows.sh` - Script to trigger workflows via API
- `QUICK_START.md` - This file

## Need Help?
If workflows fail, check:
1. GitHub Secrets are set (MONGODB_URI, MONGODB_DB)
2. MongoDB Atlas allows 0.0.0.0/0 IP access
3. Workflow logs for specific error messages


