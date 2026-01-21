# Scraper Changes Verification Guide

## What Changed in Scrapers

### 1. New Priority Queries Added
- ✅ "data processing remote"
- ✅ "data processing jobs from home"
- ✅ "captioning jobs"
- ✅ "captioning jobs remote"
- ✅ "transcription jobs remote"

### 2. Exclusion Filters Added
- ✅ Local business patterns (Tony's Plumbing, etc.)
- ✅ Company-specific searches (Indulge Travels, etc.)
- ✅ Hyper-local indicators (must live in [city])
- ✅ On-site only jobs

## Verification Steps

### Check 1: Verify No Bad Jobs Are Being Added

**Database Check** (after next scraper run):
```javascript
// Run in MongoDB or via your admin panel
db.jobs.find({
  $or: [
    { company: /tony's.*plumbing/i },
    { company: /indulge.*travel/i },
    { title: /modesto/i },
    { description: /on-site only/i }
  ]
}).count()

// Expected: 0 (or very low number)
```

**Manual Check**:
1. Go to your job listings
2. Search for "plumbing" - should return 0 results
3. Search for "Indulge" - should return 0 results
4. Search for "Tony's" - should return 0 results

### Check 2: Verify Data Processing Jobs Are Being Added

**Database Check**:
```javascript
db.jobs.find({
  $or: [
    { title: /data processing/i },
    { description: /data processing/i }
  ]
}).count()

// Expected: Increasing over time
```

**Category Page Check**:
- Visit: https://clickclickjob.com/categories/data-processing
- Should see job listings (may take 24-48 hours for first jobs)

### Check 3: Verify Captioning Jobs Are Being Added

**Database Check**:
```javascript
db.jobs.find({
  $or: [
    { title: /captioning/i },
    { title: /caption/i },
    { description: /closed captioning/i }
  ]
}).count()

// Expected: Increasing over time
```

**Category Page Check**:
- Visit: https://clickclickjob.com/categories/captioning
- Should see job listings (may take 24-48 hours for first jobs)

## Expected Timeline

### Day 1-2 (After Next Scraper Run)
- [ ] First data processing jobs appear in database
- [ ] First captioning jobs appear in database
- [ ] Zero "Tony's Plumbing" type jobs in new imports

### Day 3-7
- [ ] Data processing category has 10+ jobs
- [ ] Captioning category has 5+ jobs
- [ ] No mis-targeted jobs appearing

### Week 2-4
- [ ] Data processing category growing steadily
- [ ] Captioning category growing steadily
- [ ] Quality of jobs noticeably better

## Testing the Exclusion Patterns

### Manual Test: Try to Import Bad Job

If you have a test scraper or can manually test:

**Test Case 1**: Local Business
```javascript
const testJob = {
  company: "Tony's Plumbing Modesto",
  title: "Plumber",
  location: "Modesto, CA"
};
// Should be rejected by excludedCompanyPatterns
```

**Test Case 2**: Company-Specific Search
```javascript
const testJob = {
  company: "Indulge Travels",
  title: "Data Entry Specialist",
  description: "Join Indulge Travels careers team"
};
// Should be rejected by excludedCompanyPatterns
```

**Test Case 3**: On-Site Only
```javascript
const testJob = {
  company: "Tech Corp",
  title: "Admin Assistant",
  description: "On-site only position, no remote option"
};
// Should be rejected by excludedCompanyPatterns
```

## What Good Looks Like

### Good Data Processing Job
```javascript
{
  company: "Healthcare Corp",
  title: "Remote Data Processing Specialist",
  description: "Process medical claims data from home. Entry-level welcome.",
  location: "Remote",
  salary: "$18-24/hour"
}
// ✅ Should be accepted and categorized correctly
```

### Good Captioning Job
```javascript
{
  company: "Rev.com",
  title: "Remote Captioner",
  description: "Create captions for videos. Work from anywhere.",
  location: "Remote - US",
  salary: "$15-30/hour"
}
// ✅ Should be accepted and categorized correctly
```

## Troubleshooting

### Problem: Data Processing Jobs Not Appearing

**Check**:
1. Are scrapers running? (check scraper logs)
2. Is JobSpy enabled? (check config: `ENABLE_JOBSPY_INDEED=true`)
3. Are queries actually being sent? (check scraper logs for query list)

**Solution**:
```bash
# Check scraper configuration
cat config/config.js | grep "data processing"

# Should show the new queries
```

### Problem: Bad Jobs Still Getting Through

**Check**:
1. What pattern do they match?
2. Is the pattern in excludedCompanyPatterns?

**Solution**:
Add more specific pattern to `config/config.js`:
```javascript
excludedCompanyPatterns: [
  // Add your new pattern here
  /new-pattern-to-exclude/i,
  // ... existing patterns
]
```

Then commit and redeploy.

### Problem: Too Many Jobs Being Excluded

**Symptoms**:
- Job count decreasing overall
- Good jobs being rejected

**Check**:
Review scraper logs for rejection reasons

**Solution**:
May need to make exclusion patterns more specific. Contact if this happens.

## Monitoring Commands

### Check Recent Job Additions (if using MongoDB)
```javascript
// Jobs added in last 24 hours
db.jobs.find({
  createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
}).limit(20).pretty()

// Group by category to see what's being added
db.jobs.aggregate([
  { $match: { createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } } },
  { $group: { _id: "$jobCategory", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### Check for Excluded Patterns
```bash
# Search your scraped results for exclusion matches
grep -i "tony's plumbing" results/*.json
# Expected: 0 results

grep -i "indulge travels" results/*.json  
# Expected: 0 results
```

## Next Scraper Run

**When**: Depends on your scraper schedule (check cron job or manual run)

**What to Watch**:
1. Log output - should see new queries being executed
2. Results file - should see data processing and captioning jobs
3. Database - should see new jobs in correct categories

**How to Manually Trigger** (if needed):
```bash
# If you have a manual scraper script
npm run scrape
# or
node run-all-scrapers.js
```

## Success Indicators

### After 7 Days
✅ Data processing category has 10+ jobs
✅ Captioning category has 5+ jobs
✅ Zero "Tony's Plumbing" matches in database
✅ Zero "Indulge Travels" matches in database

### After 30 Days
✅ Data processing category has 50+ jobs
✅ Captioning category has 25+ jobs
✅ Less than 5 mis-targeted jobs total
✅ Google Search Console showing improved relevance

## Contact/Help

If you see:
- ❌ No data processing jobs after 48 hours
- ❌ No captioning jobs after 48 hours
- ❌ Bad jobs still appearing frequently
- ❌ Good jobs being rejected incorrectly

Then we need to troubleshoot the scraper configuration.

---

**Last Updated**: January 2, 2026
**Status**: Scraper changes deployed, awaiting first run
**Next Check**: After next scraper execution



