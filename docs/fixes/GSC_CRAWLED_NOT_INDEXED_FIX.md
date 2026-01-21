# GSC "Crawled - Currently Not Indexed" Issue - Complete Fix

**Date:** January 5, 2026  
**Issue:** 237 pages showing "Crawled - currently not indexed" in Google Search Console  
**Status:** ✅ Fixed

---

## Problem Analysis

### Root Causes Identified

1. **❌ Soft 404s (Critical)**
   - Deleted job pages were redirecting to `/jobs` (302/307 redirect)
   - Google sees content but marks as "soft 404" - confusing signal
   - Should return `410 Gone` for permanently deleted resources

2. **❌ Stale Sitemap**
   - Sitemap included deleted jobs (cached for 1 hour)
   - Google crawled these URLs expecting content
   - Found redirects instead of actual jobs

3. **❌ No Deleted Jobs Tracking**
   - System couldn't distinguish between:
     - Jobs that never existed (404)
     - Jobs that were deleted (410 Gone)
   - Both returned same redirect response

4. **❌ WWW/Non-WWW Inconsistency**
   - Some internal links used `clickclickjob.com` (no www)
   - Caused 308 permanent redirects
   - Wasted crawl budget and diluted SEO signals

### Impact

- **237 pages** affected (dropped from ~6,964 in November)
- Wasted Google crawl budget on deleted pages
- Confused search engine signals (redirect vs deleted)
- Potential ranking impact due to soft 404s

---

## Solutions Implemented

### 1. ✅ Deleted Jobs Tracking System

**Created:** `frontend/utils/deletedJobsTracker.ts`

- New MongoDB collection: `deleted_jobs`
- Tracks job ID, deletion date, original metadata
- TTL index: auto-deletes records after 90 days
- Enables proper 410 Gone responses

**Key Functions:**
```typescript
trackDeletedJob(jobId, metadata)      // Track single deletion
trackDeletedJobs(jobIds, metadata)    // Bulk tracking
wasJobDeleted(jobId)                  // Check if deleted
```

**Setup Script:** `scripts/setup-deleted-jobs-tracking.js`
```bash
node scripts/setup-deleted-jobs-tracking.js
```

**Migration Script:** `scripts/track-existing-deletions.js`
```bash
node scripts/track-existing-deletions.js
```

### 2. ✅ Proper HTTP Status Codes

**Modified:** `frontend/pages/jobs/[id].tsx`

**Changes:**
- Check `deleted_jobs` collection before querying jobs
- Return `410 Gone` for deleted jobs (not redirect)
- Return `404 Not Found` for never-existed jobs
- Add cache headers for 410 responses (24 hours)

**Benefits:**
- Clear signal to Google: "This resource is permanently gone"
- Google removes from index faster
- No more soft 404 issues
- Better crawl budget usage

### 3. ✅ Updated Job Cleanup Scripts

**Modified:** `cleanup-old-jobs-enhanced.js`

**Changes:**
- Track jobs before deletion
- Bulk insert to `deleted_jobs` collection
- Preserve metadata (title, company, URL)
- Works with all cleanup operations

**Usage:**
```bash
# Standard cleanup (tracks deletions)
node cleanup-old-jobs-enhanced.js --days=30

# Dry run to see what would be deleted
node cleanup-old-jobs-enhanced.js --days=30 --dry-run

# Remove invalid jobs (also tracks)
node cleanup-old-jobs-enhanced.js --remove-invalid
```

### 4. ✅ Sitemap Cache Optimization

**Modified:**
- `frontend/pages/api/sitemap.xml.ts`
- `frontend/src/pages/sitemap-jobs.xml.tsx`

**Changes:**
- Reduced cache from 1 hour to 5 minutes
- Ensures sitemap updates quickly after deletions
- Added stale-while-revalidate for performance

**Revalidation Script:** `scripts/revalidate-sitemap.js`
```bash
node scripts/revalidate-sitemap.js
```

### 5. ✅ WWW Redirect Middleware

**Created:** `frontend/middleware.ts`

**Features:**
- Redirects non-www to www (301 permanent)
- Removes trailing slashes
- Adds security headers
- Excludes localhost and Vercel previews

**Result:**
- All URLs consistently use `www.clickclickjob.com`
- No more 308 redirects on internal links
- Better crawl efficiency

### 6. ✅ GSC Removal Request Generator

**Created:** `scripts/generate-gsc-removal-requests.js`

**Generates:**
- JSON file with all deleted job URLs
- CSV file for spreadsheet import
- TXT file for bulk operations

**Usage:**
```bash
node scripts/generate-gsc-removal-requests.js
```

**Output:** `reports/gsc-removal-requests/`

---

## Deployment Steps

### Phase 1: Setup (One-time)

```bash
# 1. Setup deleted jobs collection
node scripts/setup-deleted-jobs-tracking.js

# 2. Track existing deletions from GSC data
node scripts/track-existing-deletions.js

# 3. Verify tracking
# Check MongoDB deleted_jobs collection has records
```

### Phase 2: Deploy Code Changes

```bash
# 1. Deploy frontend changes
cd frontend
npm run build
# Deploy to Vercel

# 2. Verify middleware is active
# Check that non-www redirects to www

# 3. Test deleted job page
# Visit a deleted job URL
# Should see 410 Gone status (not redirect)
```

### Phase 3: Sitemap & GSC

```bash
# 1. Revalidate sitemap
node scripts/revalidate-sitemap.js

# 2. Generate removal requests
node scripts/generate-gsc-removal-requests.js

# 3. Submit to Google Search Console
# - Go to GSC > Removals
# - Submit outdated content requests
# - Or wait for natural recrawl (slower)
```

---

## Verification & Monitoring

### Immediate Checks

1. **Test Deleted Job Page:**
   ```bash
   curl -I https://www.clickclickjob.com/jobs/683da14dba2b958c334e3c00
   # Should return: HTTP/1.1 410 Gone
   ```

2. **Test Non-WWW Redirect:**
   ```bash
   curl -I https://clickclickjob.com
   # Should return: 301 redirect to www.clickclickjob.com
   ```

3. **Check Sitemap:**
   ```bash
   curl https://www.clickclickjob.com/sitemap.xml
   # Should NOT include deleted job IDs
   ```

4. **Verify Tracking:**
   ```javascript
   // In MongoDB
   db.deleted_jobs.countDocuments()
   // Should show tracked deletions
   ```

### Ongoing Monitoring

1. **Google Search Console**
   - Monitor "Crawled - currently not indexed" count
   - Should decrease over 2-4 weeks
   - Check Coverage report for 410 responses

2. **Server Logs**
   - Monitor 410 responses
   - Verify Google bot sees 410 (not redirects)

3. **Sitemap Freshness**
   - Check sitemap updates after job deletions
   - Verify cache headers are working

---

## Expected Results

### Short Term (1-2 weeks)
- ✅ Deleted job pages return 410 Gone
- ✅ Sitemap excludes deleted jobs
- ✅ All URLs use www subdomain
- ✅ No more soft 404s

### Medium Term (2-4 weeks)
- 📉 "Crawled - not indexed" count decreases
- 📈 Crawl efficiency improves
- ✅ Google removes deleted pages from index
- ✅ Better crawl budget allocation

### Long Term (1-3 months)
- ✅ Stable index coverage
- ✅ No recurring soft 404 issues
- ✅ Improved organic search performance
- ✅ Better user experience

---

## Maintenance

### Regular Tasks

1. **After Bulk Job Deletions:**
   ```bash
   node scripts/revalidate-sitemap.js
   node scripts/generate-gsc-removal-requests.js
   ```

2. **Monthly Cleanup:**
   ```bash
   node cleanup-old-jobs-enhanced.js --days=30
   ```

3. **Monitor Tracking:**
   ```javascript
   // Check deleted_jobs collection size
   db.deleted_jobs.countDocuments()
   
   // TTL index auto-cleans after 90 days
   // No manual intervention needed
   ```

### Troubleshooting

**Issue: 410 responses not working**
- Check `deleted_jobs` collection has entries
- Verify `wasJobDeleted()` function is called
- Check MongoDB connection in production

**Issue: Sitemap still has deleted jobs**
- Run revalidation script
- Check cache headers are set correctly
- Verify CDN cache is cleared

**Issue: Non-www still accessible**
- Check middleware.ts is deployed
- Verify Vercel configuration
- Test with curl to bypass browser cache

---

## Technical Details

### HTTP Status Codes Used

- **410 Gone:** Permanently deleted resources
  - Better than 404 for SEO
  - Signals "don't try again"
  - Faster removal from index

- **404 Not Found:** Never existed
  - Standard for missing resources
  - Google may retry later

- **301 Moved Permanently:** WWW redirect
  - Consolidates SEO signals
  - Prevents duplicate content

### Database Schema

**deleted_jobs collection:**
```javascript
{
  jobId: String (unique),
  deletedAt: Date,
  expiresAt: Date,  // TTL: deletedAt + 90 days
  originalTitle: String,
  originalCompany: String,
  originalUrl: String,
  source: String  // 'cleanup_old_jobs', 'gsc_migration', etc.
}
```

**Indexes:**
- `{ expiresAt: 1 }` - TTL index for auto-cleanup
- `{ jobId: 1 }` - Unique index for fast lookups
- `{ deletedAt: 1 }` - For reporting/analytics

---

## Files Modified

### New Files
- `frontend/utils/deletedJobsTracker.ts`
- `frontend/middleware.ts`
- `scripts/setup-deleted-jobs-tracking.js`
- `scripts/track-existing-deletions.js`
- `scripts/revalidate-sitemap.js`
- `scripts/generate-gsc-removal-requests.js`
- `docs/fixes/GSC_CRAWLED_NOT_INDEXED_FIX.md`

### Modified Files
- `frontend/pages/jobs/[id].tsx`
- `frontend/pages/api/sitemap.xml.ts`
- `frontend/src/pages/sitemap-jobs.xml.tsx`
- `cleanup-old-jobs-enhanced.js`

---

## References

- [Google: HTTP 410 for deleted content](https://developers.google.com/search/docs/crawling-indexing/http-status-codes)
- [Google: Soft 404 errors](https://developers.google.com/search/docs/crawling-indexing/soft-404)
- [Google: Remove outdated content](https://support.google.com/webmasters/answer/9689846)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## Support

For issues or questions:
1. Check MongoDB `deleted_jobs` collection
2. Review server logs for 410 responses
3. Monitor GSC Coverage report
4. Verify sitemap freshness

**Last Updated:** January 5, 2026

