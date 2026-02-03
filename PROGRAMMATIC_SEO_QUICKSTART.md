# Programmatic SEO - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Verify Installation

```bash
node scripts/verify-programmatic-seo.js
```

This checks that all files are properly installed. You should see all green checkmarks ✓.

### Step 2: Run Database Migration

```bash
node scripts/migrate-job-data-for-programmatic-seo.js
```

This normalizes your job data with the necessary fields:
- `jobCategory` (data-entry, virtual-assistant, etc.)
- `experienceLevel` (entry-level, no-experience, etc.)
- `jobType` (part-time, full-time, contract)
- `location_restriction` (texas, california, etc.)

**Expected output:**
```
✓ Connected to MongoDB
Found 1,234 total jobs in database
Found 856 jobs that need updating
...
MIGRATION COMPLETE
Jobs updated: 856
```

### Step 3: Build Pages Locally

```bash
cd frontend
npm run build
```

This generates all Phase 1 programmatic pages (~200 pages).

**Build time:** 2-5 minutes depending on your machine.

### Step 4: Test Locally

```bash
npm run dev
```

Then visit these test URLs:

**Category Pages:**
- http://localhost:3000/jobs/data-entry
- http://localhost:3000/jobs/virtual-assistant

**Category + State Pages:**
- http://localhost:3000/jobs/data-entry/texas
- http://localhost:3000/jobs/virtual-assistant/california
- http://localhost:3000/jobs/customer-service/florida

**Category + State + Modifier Pages:**
- http://localhost:3000/jobs/data-entry/texas/entry-level
- http://localhost:3000/jobs/data-entry/texas/no-experience
- http://localhost:3000/jobs/data-entry/texas/part-time
- http://localhost:3000/jobs/virtual-assistant/california/entry-level

### Step 5: Verify SEO Elements

On any page, check:

1. **View Page Source** (Ctrl/Cmd + U)
   - Look for `<title>` tag (should show job count and year)
   - Look for `<meta name="description">` 
   - Look for `<link rel="canonical">`
   - Look for `<script type="application/ld+json">` (schema markup)

2. **Test Schema Markup**
   - Copy page URL
   - Visit: https://search.google.com/test/rich-results
   - Paste URL and test
   - Should show: JobPosting, FAQPage, BreadcrumbList schemas

3. **Check Content Uniqueness**
   - Compare two similar pages (e.g., Texas vs Florida)
   - Intro paragraphs should be < 30% similar
   - State-specific facts should be different

### Step 6: Deploy to Production

```bash
# Build production version
npm run build

# Deploy (example for Vercel)
vercel --prod

# Or for other platforms:
# - Netlify: netlify deploy --prod
# - AWS: aws s3 sync out/ s3://your-bucket
# - Custom: rsync -avz out/ user@server:/var/www/
```

### Step 7: Submit to Google

1. **Generate sitemap URL:**
   - https://yoursite.com/sitemap-programmatic.xml

2. **Submit to Google Search Console:**
   - Go to: https://search.google.com/search-console
   - Select your property
   - Navigate to: Sitemaps
   - Add sitemap: `sitemap-programmatic.xml`
   - Click "Submit"

3. **Request indexing for top pages:**
   - In GSC, go to URL Inspection
   - Enter URL (e.g., `/jobs/data-entry/texas`)
   - Click "Request Indexing"
   - Repeat for 20-30 top priority pages

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Migration completed successfully (check console output)
- [ ] All test URLs load without errors
- [ ] Page titles include dynamic job count and current year
- [ ] Schema markup validates in Google Rich Results Test
- [ ] Unique intro paragraphs per page (< 30% similarity)
- [ ] FAQs render with proper schema
- [ ] Breadcrumbs display correctly
- [ ] Related links work
- [ ] Email signup form functions
- [ ] Mobile responsive (test on phone)
- [ ] Page loads in < 3 seconds (test with PageSpeed Insights)
- [ ] Sitemap submitted to Google Search Console
- [ ] Top 20-30 pages manually requested for indexing

---

## 📊 Monitor Results

### Week 1: Indexing Phase
Check Google Search Console daily:
- Coverage > Indexed: Should see pages appearing
- Goal: 50+ pages indexed

### Week 2-4: Initial Rankings
- Performance > Search Results: Watch for impressions
- Goal: 1,000+ impressions/week

### Month 2-3: Growth Phase
- Track organic traffic in Google Analytics
- Goal: 5,000+ monthly visitors

### Month 6-12: Maturity
- Optimize based on performance data
- Goal: 15,000+ monthly visitors

---

## 🔧 Troubleshooting

### Issue: "Cannot find module programmaticSeo"

**Solution:**
```bash
cd frontend
npm install
npm run build
```

### Issue: "MongoDB connection failed"

**Solution:**
1. Check `.env.local` has `MONGODB_URI`
2. Verify MongoDB is accessible
3. Test connection: `node -e "require('./frontend/lib/db').default()"`

### Issue: "No jobs found on pages"

**Solution:**
1. Run migration script first
2. Check MongoDB has jobs with proper fields
3. Test query manually in MongoDB Compass

### Issue: "Pages return 404"

**Solution:**
1. Rebuild: `cd frontend && npm run build`
2. Check file paths match URL structure
3. Verify `getStaticPaths` includes your URL

### Issue: "Google not indexing pages"

**Solution:**
1. Wait 2-3 weeks (normal delay)
2. Check robots.txt allows `/jobs/`
3. Submit sitemap again
4. Request indexing for top pages manually
5. Check for manual actions in GSC

---

## 📈 Optimization Tips

### Week 1-2: Foundation
- Focus on indexing, not rankings
- Submit top 50 pages manually to GSC
- Monitor for errors in GSC Coverage report

### Month 1: Content Refinement
- Identify pages with 0 jobs
- Add more job sources
- Improve category detection patterns
- Add more state-specific facts

### Month 2-3: Performance Optimization
- Analyze which pages get traffic
- Double down on high-performers
- Add more modifier combinations to top states
- Create more detailed content for top pages

### Month 4-6: Scaling
- Add Tier 2 and Tier 3 states
- Build out full 450 pages
- Create internal linking campaigns
- Build backlinks to top pages

### Month 6-12: Domination
- Add more states (all 50)
- Add more categories (administrative, clerical, etc.)
- Add seasonal modifiers (summer, holiday)
- Create city-level pages for top metros

---

## 🎯 Expected Results by Month

| Month | Pages | Indexed | Traffic | Key Actions |
|-------|-------|---------|---------|-------------|
| 1 | 75 | 30-50 | 500 | Submit sitemap, request indexing |
| 2 | 150 | 80-120 | 2,000 | Build Tier 2 states |
| 3 | 225 | 150-180 | 5,000 | Optimize top performers |
| 6 | 450 | 350-400 | 10,000 | Full deployment, link building |
| 12 | 450+ | 400-450 | 20,000 | Mature rankings, ongoing optimization |

---

## 📞 Need Help?

**Common Questions:**

1. **How long until I see traffic?**
   - Initial indexing: 2-4 weeks
   - Meaningful traffic: 2-3 months
   - Target traffic: 6-12 months

2. **Should I build all 450 pages at once?**
   - No, start with Phase 1 (75 pages)
   - Validate approach with data
   - Scale gradually based on results

3. **What if I don't have many jobs in a state?**
   - Focus on states where you have 5+ jobs
   - Use "no jobs available" messaging + email signup
   - Consider showing nationwide jobs as fallback

4. **How often should I update content?**
   - Job listings: Daily (automatic via database)
   - Static content: Quarterly (salary data, facts)
   - New pages: Monthly (add new states/categories)

---

## 🎉 You're Ready!

Your programmatic SEO system is now:
- ✅ Fully implemented
- ✅ Generating unique content
- ✅ SEO-optimized with schema markup
- ✅ Ready to scale to 450+ pages

**Next:** Follow the 7-step process above to launch your first 75 pages!

Questions? Review `PROGRAMMATIC_SEO_README.md` for detailed documentation.
