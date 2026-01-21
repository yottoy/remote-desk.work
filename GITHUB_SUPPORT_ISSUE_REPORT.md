# GitHub Actions Issue Report for Support

**Repository**: `yottoy/remote-desk.work`  
**Account**: `yottoy`  
**Issue Date**: Actions stopped working after August 20, 2025  
**Current Date**: December 27, 2025

---

## Summary

All GitHub Actions workflows stopped triggering after August 20, 2025. Despite correct configuration, no workflows have run for over 4 months, regardless of trigger type (push, schedule, or manual).

---

## Evidence That Actions Were Working

**Last Successful Workflow Run:**
- **Date**: August 20, 2025
- **Workflow**: "Main Job Scraper"
- **Branch**: `main`
- **Trigger**: `schedule` (cron)
- **Status**: Successfully completed

**Total Historical Runs**: 315 workflow runs (all before August 20, 2025)

---

## Evidence That Actions Are Not Working Now

### 1. Push Triggers Not Working
**Test Date**: December 26-27, 2025

Made **8 commits** to `main` branch with push triggers configured:
- Commit `1b9c17c`: Test: Force workflow trigger after reset
- Commit `98ee86b`: Fix: Trigger scraper on ANY push to test
- Commit `f2f71c8`: Trigger Main Job Scraper to run now
- Commit `8401a2f`: Test: Add push-triggered workflow
- Commit `6b14e14`: Add test workflow to verify GitHub Actions setup
- Commit `362b1aa`: Add additional scraper workflows
- Commit `4416d8a`: Fix: Re-enable scrapers with zero storage usage
- Commit `13d309b`: Re-add workflow_dispatch trigger for manual runs

**Result**: ZERO workflow runs triggered

**Workflows with push triggers:**
- `.github/workflows/push-test.yml` - Simple test workflow
- `.github/workflows/direct-scraper.yml` - Main Job Scraper

Both specify:
```yaml
on:
  push:
    branches: [ main ]
```

### 2. Manual Triggers Not Working
**Test Date**: December 26-27, 2025

Attempted manual workflow runs via "Run workflow" button:
- Multiple attempts on "Test Workflow"
- Multiple attempts on "Main Job Scraper"

**Result**: 
- Button shows "Workflow run was successfully requested"
- But NO runs appear in the Actions tab
- No queued jobs
- No new entries in workflow runs list

### 3. Schedule Triggers Not Working
**Configured schedules:**
- `direct-scraper.yml`: Daily at 10 AM UTC
- `jobspy-scraper.yml`: Daily at 2 AM UTC
- `scrape-jobs.yml`: Every 12 hours
- `run-scrapers.yml`: Every 12 hours

**Result**: No scheduled runs have executed since August 20, 2025

---

## Configuration Verification

### Actions Settings (Verified December 27, 2025)

**Actions Permissions**:
- ✅ "Allow all actions and reusable workflows" - ENABLED

**Workflow Permissions**:
- ✅ "Read and write permissions" - ENABLED
- ✅ "Allow GitHub Actions to create and approve pull requests" - CHECKED

**Fork Pull Request Settings**:
- Configured (not relevant for main branch pushes)

**Repository Status**:
- ✅ NOT archived
- ✅ Public repository (unlimited Actions minutes)
- ✅ No visible restrictions or warnings

### Branch Configuration

**Default Branch**: `main`
**Working Branch**: `main`
**Workflow Branch Targets**: `main`

Verified via:
```bash
git branch --show-current
# Output: main

git ls-remote --symref origin HEAD
# Output: ref: refs/heads/main	HEAD
```

### Workflow File Verification

**Total Workflow Files**: 12
**Location**: `.github/workflows/`

Sample verified workflows:
1. `direct-scraper.yml` - EXISTS on GitHub, valid YAML
2. `push-test.yml` - EXISTS on GitHub, valid YAML
3. `test-setup.yml` - EXISTS on GitHub, valid YAML

All files are:
- ✅ Committed to repository
- ✅ Present on `main` branch
- ✅ Valid YAML syntax
- ✅ Properly configured triggers

---

## Diagnostic Steps Taken

1. ✅ Verified Actions are enabled in repository settings
2. ✅ Changed from private to public repository
3. ✅ Disabled and re-enabled Actions (reset)
4. ✅ Verified workflow files exist on GitHub
5. ✅ Checked for branch name mismatches (none found)
6. ✅ Verified no runners configuration issues
7. ✅ Checked for repository archived status (not archived)
8. ✅ Attempted multiple push, schedule, and manual triggers
9. ✅ Cleared browser cache and tried different browsers
10. ✅ Verified no filters hiding workflow runs

---

## Unusual Observations

### 1. Actions Page Returns 404 (API Level)
```bash
curl -I "https://github.com/yottoy/remote-desk.work/actions"
# Returns: HTTP/2 404
```

However, the Actions page IS visible and accessible in the browser UI, showing historical runs.

### 2. Workflow Runs Endpoint Empty
`https://github.com/yottoy/remote-desk.work/actions/workflows/push-test.yml/runs`

Shows: "No workflow runs have been triggered for this workflow"

Despite push triggers being configured and commits being made.

### 3. Actions Runs Endpoint Returns 404
`https://github.com/yottoy/remote-desk.work/actions/runs`

Returns 404 instead of showing runs list.

---

## Impact

**Business Impact**: High
- Job board website showing 167-day-old stale data
- Unable to automatically update job listings
- Manual workarounds required

**Blocking**: Complete
- No workflow trigger method works (push, schedule, manual)
- Actions infrastructure appears completely non-functional for this repository

---

## Additional Context

### Related Issue (Now Resolved)
MongoDB Atlas quota was full (525 MB / 512 MB), which was causing import failures. However:
- This would only affect workflow SUCCESS, not workflow TRIGGERING
- Workflows should still appear in the Actions tab even if they fail
- This issue is now resolved (old data deleted, fresh data imported)

### What Works
- ✅ Git push/pull operations
- ✅ Manual scraper execution locally
- ✅ MongoDB connections
- ✅ Actions UI is visible
- ✅ Historical workflow runs are viewable

### What Doesn't Work
- ❌ Any new workflow runs (since August 20, 2025)
- ❌ Push triggers
- ❌ Schedule triggers  
- ❌ Manual triggers (workflow_dispatch)

---

## Request

Please investigate why GitHub Actions has stopped functioning for this repository and restore workflow triggering capability. The same workflows and configuration that worked before August 20, 2025 are no longer triggering any runs.

---

**Prepared**: December 27, 2025  
**Repository Owner**: yottoy  
**Repository**: remote-desk.work






