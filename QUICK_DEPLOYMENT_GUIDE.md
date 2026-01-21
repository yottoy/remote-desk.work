# Quick Deployment Guide - GSC Fix

**Fix for:** "Crawled - currently not indexed" (237 pages)  
**Time Required:** 30 minutes  
**Date:** January 5, 2026

---

## 🚀 Quick Start (3 Steps)

### Step 1: Setup Database (5 min)

```bash
# Setup deleted jobs tracking collection
node scripts/setup-deleted-jobs-tracking.js

# Track existing deletions from GSC data
node scripts/track-existing-deletions.js
```

**Expected Output:**
```
✅ Created TTL index for auto-cleanup
✅ Created unique index on jobId
📊 Current tracked deleted jobs: 237
```

### Step 2: Deploy Frontend (10 min)

```bash
cd frontend

# Install dependencies (if needed)
npm install

# Build
npm run build

# Deploy to Vercel
vercel --prod
# Or push to GitHub (auto-deploys)
```

**What's Deployed:**
- ✅ 410 Gone for deleted jobs
- ✅ WWW redirect middleware
- ✅ Fresh sitemap (5-min cache)

### Step 3: Notify Google (15 min)

```bash
# Generate removal request list
node scripts/generate-gsc-removal-requests.js

# Output: reports/gsc-removal-requests/url-list-YYYY-MM-DD.txt
```

**Then:**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property
3. Click "Removals" in left sidebar
4. Click "Outdated Content"
5. Submit URLs from generated list

---

## ✅ Verification (5 min)

### Test 1: Deleted Job Returns 410

```bash
curl -I https://www.clickclickjob.com/jobs/683da14dba2b958c334e3c00
```

**Expected:** `HTTP/1.1 410 Gone`

### Test 2: WWW Redirect Works

```bash
curl -I https://clickclickjob.com
```

**Expected:** `301` redirect to `www.clickclickjob.com`

### Test 3: Sitemap Fresh

```bash
curl -I https://www.clickclickjob.com/sitemap.xml | grep Cache-Control
```

**Expected:** `s-maxage=300` (5 minutes)

### Test 4: Database Tracking

```javascript
// In MongoDB shell or Compass
db.deleted_jobs.countDocuments()
// Should show ~237 records
```

---

## 📊 Expected Timeline

| Timeline | Expected Result |
|----------|----------------|
| **Immediate** | ✅ 410 responses working |
| **1 week** | 📉 GSC errors start decreasing |
| **2-4 weeks** | 📉 50-80% reduction in errors |
| **1-3 months** | ✅ Issue fully resolved |

---

## 🔧 Troubleshooting

### Problem: 410 not working

**Check:**
```bash
# Verify deleted_jobs collection exists
mongo $MONGODB_URI --eval "db.deleted_jobs.countDocuments()"

# Check if specific job is tracked
mongo $MONGODB_URI --eval 'db.deleted_jobs.findOne({jobId: "683da14dba2b958c334e3c00"})'
```

**Fix:** Re-run `scripts/track-existing-deletions.js`

### Problem: Sitemap still cached

**Fix:**
```bash
node scripts/revalidate-sitemap.js
```

### Problem: WWW redirect not working

**Check:** Verify `frontend/middleware.ts` is deployed

**Fix:** Redeploy frontend

---

## 📝 Maintenance

### After Each Job Cleanup

```bash
# Cleanup runs automatically track deletions
node cleanup-old-jobs-enhanced.js --days=30

# Revalidate sitemap
node scripts/revalidate-sitemap.js
```

### Monthly Check

1. Monitor GSC "Coverage" report
2. Check `deleted_jobs` collection size
3. Review 410 response logs

---

## 📚 Full Documentation

See: `docs/fixes/GSC_CRAWLED_NOT_INDEXED_FIX.md`

---

## ❓ Need Help?

1. Check MongoDB connection
2. Verify environment variables
3. Review server logs for errors
4. Check GSC Coverage report

**Key Files:**
- `frontend/utils/deletedJobsTracker.ts` - Tracking logic
- `frontend/pages/jobs/[id].tsx` - 410 responses
- `frontend/middleware.ts` - WWW redirects
- `cleanup-old-jobs-enhanced.js` - Auto-tracking on cleanup

