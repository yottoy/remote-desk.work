# ✅ Before Monday Checklist - Weekly Digest

**Date:** February 3, 2026  
**Next Send:** Monday, February 10, 2026 at 2 PM UTC

---

## 🎯 Current Status

### ✅ WORKING
- ✅ **Email sending via SendGrid** - Fully functional
- ✅ **Subscriber list** - 5 active subscribers synced from MailerLite  
- ✅ **Fresh job filtering** - Gets jobs from last 7 days using `createdAt`
- ✅ **Email template** - Beautiful design with "See All Jobs" button
- ✅ **Manual sending script** - `send-to-all-subscribers-now.js` works perfectly

### ⚠️ NEEDS FIXING
- ⚠️ **Automated cron endpoint** - `/api/digest/weekly` returns 401 Unauthorized
- ⚠️ **Vercel deployments** - Recent deployments failing (build errors)

---

## 🔧 What Needs to Be Done Before Monday

### Option 1: Fix Automated Cron (Recommended)
**Goal:** Get the Vercel cron job working so emails send automatically

#### Steps:
1. **Fix build issues**
   - Recent Vercel deployments are failing
   - Need to get a successful production deployment
   - Test: `cd frontend && npm run build` should succeed

2. **Verify CRON_SECRET matches**
   - Production secret: `***REMOVED***`
   - Test the auth endpoint once deployment succeeds
   - Command: `curl -X POST https://www.clickclickjob.com/api/digest/weekly -H "Authorization: Bearer ***REMOVED***"`

3. **Test the cron endpoint**
   - Should return 200 with success message
   - Should send emails to all 5 subscribers

**Time estimate:** 1-2 hours

---

### Option 2: Manual Send (Backup Plan)
**Goal:** Manually send the digest every Monday if cron doesn't work

#### Steps:
1. **Every Monday at 2 PM UTC** (or whenever you want to send)
2. **Run this command:**
   ```bash
   cd /Users/yotamtroim/Library/Mobile\ Documents/com~apple~CloudDocs/Projects/remote-desk.work
   node scripts/send-to-all-subscribers-now.js
   ```
3. **Verify** email arrives in your inbox

**Time estimate:** 2 minutes per week

---

## 📧 Email Sending Script (WORKS NOW!)

### To Send Digest Manually Anytime:

```bash
cd /Users/yotamtroim/Library/Mobile\ Documents/com~apple~CloudDocs/Projects/remote-desk.work
node scripts/send-to-all-subscribers-now.js
```

### What It Does:
1. Fetches 5 active subscribers from MongoDB
2. Gets 10 fresh jobs from last 7 days
3. Generates beautiful HTML email
4. Sends via SendGrid to all subscribers
5. Takes ~3 seconds to complete

### Output Example:
```
📧 Sending Weekly Digest to ALL Subscribers

✅ Found 5 active subscribers:
   1. yotamt@gmail.com
   2. ***REMOVED***
   3. ***REMOVED***
   4. ***REMOVED***
   5. ***REMOVED***

✅ Found 10 fresh jobs from last 7 days

✅ SUCCESS! Weekly digest sent to all subscribers!
```

---

## 🗓️ Weekly Schedule

### Automated (When Working)
- **Day:** Every Monday
- **Time:** 2 PM UTC (6 AM PST / 9 AM EST)
- **Trigger:** Vercel cron job
- **Endpoint:** `/api/digest/weekly`

### Manual (Backup)
- **Day:** Every Monday
- **Time:** Anytime you choose
- **Command:** `node scripts/send-to-all-subscribers-now.js`

---

## 🔍 Troubleshooting

### If Automated Cron Fails
1. Check Vercel deployment status: `cd frontend && vercel ls`
2. Look for "● Ready" deployments (not "● Error")
3. Test cron endpoint manually:
   ```bash
   curl -X POST https://www.clickclickjob.com/api/digest/weekly \
     -H "Authorization: Bearer ***REMOVED***" \
     -H "Content-Type: application/json"
   ```
4. If it returns `{"error":"Unauthorized"}`, use manual send script instead

### If Manual Send Fails
1. Check environment variables are in `.env.local`
2. Verify SendGrid API key is valid
3. Check MongoDB connection
4. Run: `node scripts/check-subscribers.js` to verify subscribers exist

---

## 📊 Current Email Configuration

| Setting | Value |
|---------|-------|
| **Service** | SendGrid |
| **From Email** | hi@clickclickjob.com |
| **From Name** | ClickClickJob Team |
| **Subscribers** | 5 active |
| **Jobs per email** | 10 (last 7 days) |
| **Subject** | 🔔 10 New Remote Jobs This Week |

---

## ✅ Testing Checklist

Before Monday, verify:

- [ ] Manual send script works: `node scripts/send-to-all-subscribers-now.js`
- [ ] Test email arrives in yotamt@gmail.com
- [ ] Email has "See All Jobs" button at bottom
- [ ] All job links go to `clickclickjob.com/jobs/view/[id]`
- [ ] Subscriber count is correct (5 people)
- [ ] Jobs are fresh (less than 7 days old)

---

## 🎯 Recommendation

**For this Monday (Feb 10):**
1. Try to fix the automated cron (Option 1)
2. If that takes too long or doesn't work, use manual send (Option 2)
3. Manual send is **proven to work** and takes 2 minutes

**Long term:**
- Fix the cron so it's fully automated
- Set a Monday morning reminder to check if emails were sent
- Keep manual send script as backup

---

## 📝 Quick Commands Reference

```bash
# Send digest manually (WORKS!)
node scripts/send-to-all-subscribers-now.js

# Check subscribers
node scripts/check-subscribers.js

# Import new subscribers from MailerLite
node scripts/import-mailerlite-subscribers.js

# Send test email to yourself only
node scripts/preview-production-email.js

# Check fresh jobs
node scripts/test-fresh-jobs-query.js

# Test automated endpoint
curl -X POST https://www.clickclickjob.com/api/digest/weekly \
  -H "Authorization: Bearer ***REMOVED***" \
  -H "Content-Type: application/json"
```

---

## 🎉 Bottom Line

**You have a working email system!** The manual send script is reliable and takes 2 minutes to run. If the automated cron doesn't work by Monday, just run the script manually. Your subscribers will get their weekly digest either way!

**Next Monday (Feb 10):**
- Either let cron run automatically (if fixed)
- OR run `node scripts/send-to-all-subscribers-now.js` manually
- Emails will be sent! ✅
