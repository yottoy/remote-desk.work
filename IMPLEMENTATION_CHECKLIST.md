# GSC Fix - Implementation Checklist

**Issue:** 237 pages "Crawled - currently not indexed"  
**Solution:** Proper 410 Gone responses + tracking system  
**Time:** ~30 minutes

---

## ✅ Pre-Deployment Checklist

### Environment Setup
- [ ] MongoDB connection string in `.env`
- [ ] `MONGODB_URI` environment variable set
- [ ] `MONGODB_DB` environment variable set (default: clickclickjob)
- [ ] `NEXT_PUBLIC_BASE_URL` set to `https://www.clickclickjob.com`

### Files Review
- [ ] `frontend/utils/deletedJobsTracker.ts` - exists
- [ ] `frontend/middleware.ts` - exists
- [ ] `frontend/pages/jobs/[id].tsx` - modified
- [ ] `cleanup-old-jobs-enhanced.js` - modified
- [ ] All scripts in `scripts/` folder - exist

---

## 🚀 Deployment Steps

### Phase 1: Database Setup (5 min)

- [ ] **Step 1.1:** Run setup script
  ```bash
  node scripts/setup-deleted-jobs-tracking.js
  ```
  **Expected:** ✅ TTL index created, unique index created

- [ ] **Step 1.2:** Run migration script
  ```bash
  node scripts/track-existing-deletions.js
  ```
  **Expected:** ✅ ~237 jobs tracked from GSC data

- [ ] **Step 1.3:** Verify in MongoDB
  ```javascript
  db.deleted_jobs.countDocuments()
  // Should show ~237
  ```

### Phase 2: Frontend Deployment (10 min)

- [ ] **Step 2.1:** Install dependencies (if needed)
  ```bash
  cd frontend
  npm install
  ```

- [ ] **Step 2.2:** Build frontend
  ```bash
  npm run build
  ```
  **Expected:** ✅ Build succeeds, no errors

- [ ] **Step 2.3:** Deploy to Vercel
  ```bash
  vercel --prod
  ```
  **OR** push to GitHub (auto-deploy)
  ```bash
  git add .
  git commit -m "Fix: GSC crawled-not-indexed issue with 410 responses"
  git push origin main
  ```

- [ ] **Step 2.4:** Wait for deployment
  **Expected:** ✅ Deployment successful

### Phase 3: Verification (5 min)

- [ ] **Test 3.1:** Check 410 response
  ```bash
  curl -I https://www.clickclickjob.com/jobs/683da14dba2b958c334e3c00
  ```
  **Expected:** `HTTP/1.1 410 Gone`

- [ ] **Test 3.2:** Check WWW redirect
  ```bash
  curl -I https://clickclickjob.com
  ```
  **Expected:** `301` to `www.clickclickjob.com`

- [ ] **Test 3.3:** Check sitemap cache
  ```bash
  curl -I https://www.clickclickjob.com/sitemap.xml | grep Cache-Control
  ```
  **Expected:** `s-maxage=300`

- [ ] **Test 3.4:** Check middleware
  - Visit `https://clickclickjob.com` (no www)
  - **Expected:** Redirects to `https://www.clickclickjob.com`

### Phase 4: Google Search Console (15 min)

- [ ] **Step 4.1:** Generate removal requests
  ```bash
  node scripts/generate-gsc-removal-requests.js
  ```
  **Expected:** Files in `reports/gsc-removal-requests/`

- [ ] **Step 4.2:** Open Google Search Console
  - Go to https://search.google.com/search-console
  - Select your property (www.clickclickjob.com)

- [ ] **Step 4.3:** Submit removal requests
  - Click "Removals" in left sidebar
  - Click "Outdated Content"
  - Submit URLs from generated `url-list-*.txt`
  - **Note:** Can submit up to 1000 URLs at once

- [ ] **Step 4.4:** Request sitemap recrawl
  - Go to "Sitemaps" in GSC
  - Submit sitemap: `https://www.clickclickjob.com/sitemap.xml`
  - Click "Test" then "Submit"

---

## 📊 Post-Deployment Monitoring

### Week 1
- [ ] Check GSC Coverage report daily
- [ ] Monitor "Crawled - not indexed" count
- [ ] Verify 410 responses in server logs
- [ ] Check for any new errors

### Week 2-4
- [ ] Weekly GSC Coverage check
- [ ] Monitor index coverage trends
- [ ] Check deleted_jobs collection size
- [ ] Verify sitemap freshness

### Monthly
- [ ] Review GSC Coverage report
- [ ] Check deleted_jobs collection
  ```javascript
  db.deleted_jobs.countDocuments()
  db.deleted_jobs.find().sort({deletedAt: -1}).limit(10)
  ```
- [ ] Run cleanup if needed
  ```bash
  node cleanup-old-jobs-enhanced.js --days=30
  ```

---

## 🎯 Success Criteria

### Immediate (Day 1)
- [x] All scripts run successfully
- [x] Frontend deployed without errors
- [x] 410 responses working
- [x] WWW redirects working
- [x] Sitemap cache reduced

### Short Term (Week 1-2)
- [ ] GSC shows 410 responses in crawl stats
- [ ] "Crawled - not indexed" count starts decreasing
- [ ] No new soft 404 errors
- [ ] Deleted pages start disappearing from index

### Medium Term (Week 2-4)
- [ ] 50-80% reduction in affected pages
- [ ] Improved crawl efficiency
- [ ] Better index coverage
- [ ] Stable error count

### Long Term (1-3 months)
- [ ] 90-100% reduction in affected pages
- [ ] No recurring soft 404 issues
- [ ] Optimal crawl budget usage
- [ ] Improved organic performance

---

## 🔧 Troubleshooting

### Issue: 410 not working

**Symptoms:** Deleted job pages still redirect

**Checks:**
```bash
# Check if job is tracked
mongo $MONGODB_URI --eval 'db.deleted_jobs.findOne({jobId: "683da14dba2b958c334e3c00"})'

# Check collection exists
mongo $MONGODB_URI --eval 'db.deleted_jobs.countDocuments()'
```

**Fix:**
```bash
# Re-run migration
node scripts/track-existing-deletions.js

# Verify deployment
# Check Vercel logs for errors
```

### Issue: WWW redirect not working

**Symptoms:** Non-www URLs still accessible

**Checks:**
- Verify `frontend/middleware.ts` exists
- Check Vercel deployment logs
- Test with curl (not browser - may cache)

**Fix:**
```bash
# Redeploy frontend
cd frontend
vercel --prod --force
```

### Issue: Sitemap still cached

**Symptoms:** Sitemap shows deleted jobs

**Fix:**
```bash
# Force revalidation
node scripts/revalidate-sitemap.js

# Check cache headers
curl -I https://www.clickclickjob.com/sitemap.xml
```

### Issue: Database connection fails

**Symptoms:** Scripts error with connection issues

**Checks:**
- Verify `MONGODB_URI` in `.env`
- Test connection manually
- Check MongoDB Atlas IP whitelist

**Fix:**
```bash
# Test connection
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"

# Update .env if needed
```

---

## 📞 Support Resources

### Documentation
- **Quick Guide:** `QUICK_DEPLOYMENT_GUIDE.md`
- **Complete Guide:** `docs/fixes/GSC_CRAWLED_NOT_INDEXED_FIX.md`
- **Summary:** `GSC_FIX_SUMMARY.md`

### Key Files
- Tracking: `frontend/utils/deletedJobsTracker.ts`
- Middleware: `frontend/middleware.ts`
- Job Page: `frontend/pages/jobs/[id].tsx`
- Cleanup: `cleanup-old-jobs-enhanced.js`

### Useful Commands
```bash
# Check deleted jobs
mongo $MONGODB_URI --eval 'db.deleted_jobs.countDocuments()'

# Test 410 response
curl -I https://www.clickclickjob.com/jobs/[JOB_ID]

# Revalidate sitemap
node scripts/revalidate-sitemap.js

# Generate GSC requests
node scripts/generate-gsc-removal-requests.js
```

---

## 🎉 Completion

Once all checkboxes are marked:

- [ ] All deployment steps completed
- [ ] All tests passing
- [ ] GSC removal requests submitted
- [ ] Monitoring plan in place
- [ ] Documentation reviewed

**Status:** Ready for production! ✅

---

**Date:** January 5, 2026  
**Version:** 1.0  
**Last Updated:** Initial deployment

