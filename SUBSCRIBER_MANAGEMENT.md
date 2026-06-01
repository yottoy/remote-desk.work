# 📧 Subscriber Management Guide

## 👥 Current Subscribers

You have **5 active subscribers**:

1. **yotamt@gmail.com** (subscribed May 18, 2025)
2. **subscriber1@example.com** (subscribed Jan 21, 2026)
3. **subscriber2@example.com** (subscribed Jan 23, 2026)
4. **subscriber4@example.com** (subscribed Jan 25, 2026)
5. **subscriber3@example.com** (subscribed Jan 28, 2026)

---

## 🔄 How It Works

### When Someone New Signs Up:

1. **User visits your website** (clickclickjob.com)
2. **Fills out the subscription form** (probably on homepage or job pages)
3. **Clicks "Subscribe"**
4. **Your API endpoint** (`/api/subscribe`) is called
5. **MailerLite API** automatically adds them to your subscriber list
6. **They receive a confirmation email** (from MailerLite)
7. **They're in!** Will receive next Monday's digest

**It's fully automatic!** No manual work needed. ✅

---

## 📊 Where to View Subscribers

### Option 1: MailerLite Dashboard (Recommended)
**Best for:** Full management, detailed stats, unsubscribes, segments

**Go to:** https://dashboard.mailerlite.com/subscribers

**What you can do:**
- ✅ View all subscribers
- ✅ See subscription dates
- ✅ Export to CSV
- ✅ View unsubscribes
- ✅ Segment subscribers
- ✅ See email open rates
- ✅ Manual add/remove subscribers
- ✅ View subscriber activity

**Login:** Use your MailerLite account credentials

---

### Option 2: Run Local Script
**Best for:** Quick check without logging into MailerLite

**Command:**
```bash
cd /Users/yotamtroim/Library/Mobile\ Documents/com~apple~CloudDocs/Projects/remote-desk.work
node scripts/list-all-subscribers.js
```

**Output:**
```
📧 All Subscribers
==================

Total: 5 subscribers

1. yotamt@gmail.com
   Status: active
   Subscribed: 5/18/2025
   Source: manual

2. subscriber1@example.com
   Status: active
   Subscribed: 1/21/2026
   Source: api
...
```

---

### Option 3: MongoDB
**Best for:** Integration with other systems, custom queries

**Using MongoDB Compass:**
- Connect to: `mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/`
- Database: `clickclickjob`
- Collection: `subscribers`

**Using script:**
```bash
cd /Users/yotamtroim/Library/Mobile\ Documents/com~apple~CloudDocs/Projects/remote-desk.work
node scripts/check-subscribers.js
```

---

## 🔄 Syncing Subscribers

### MailerLite → MongoDB Sync

MailerLite is the **source of truth**. MongoDB is a backup copy.

**To sync latest subscribers to MongoDB:**
```bash
cd /Users/yotamtroim/Library/Mobile\ Documents/com~apple~CloudDocs/Projects/remote-desk.work
node scripts/import-mailerlite-subscribers.js
```

**When to run:**
- After you manually add subscribers in MailerLite
- Once a week for backup purposes
- Before doing custom analysis in MongoDB

**Weekly digest automatically fetches from MongoDB**, so keep it in sync!

---

## ➕ Adding Subscribers Manually

### Via MailerLite Dashboard:
1. Go to: https://dashboard.mailerlite.com/subscribers
2. Click "Add subscriber"
3. Enter email address
4. Click "Save"
5. **Important:** Run sync script to update MongoDB:
   ```bash
   node scripts/import-mailerlite-subscribers.js
   ```

### Via Your Website:
- Users can subscribe at: https://clickclickjob.com
- Look for "Get Job Alerts" or "Subscribe" button
- Fully automatic, no manual work needed!

---

## 🚫 Managing Unsubscribes

### Automatic Unsubscribes:
Every email includes an unsubscribe link. When users click it:
1. MailerLite automatically marks them as "unsubscribed"
2. They stop receiving emails immediately
3. You can see them in MailerLite dashboard under "Unsubscribed"

### Manual Unsubscribes:
If someone emails you asking to unsubscribe:
1. Go to: https://dashboard.mailerlite.com/subscribers
2. Search for their email
3. Click on it
4. Click "Unsubscribe"
5. Run sync script to update MongoDB

---

## 📈 Subscriber Growth

### Current Status:
- **Total:** 5 subscribers
- **Active:** 5
- **Growth:** 4 new subscribers in last 14 days (since Jan 21)

### Subscription Sources:
- **Manual:** 1 (you added yourself)
- **API (website):** 4 (signed up via your site)

### To Increase Subscribers:

1. **Add subscription forms to:**
   - Job listing pages
   - Homepage hero section
   - Footer on every page
   - 404 error page
   - After job application clicks

2. **Promote the newsletter:**
   - Add "📧 Get weekly job alerts" CTA
   - Mention it in social media
   - Add to email signatures
   - Mention benefits: "Never miss new remote jobs!"

3. **Track conversion:**
   - Check MailerLite analytics
   - See which pages drive most signups
   - A/B test different CTAs

---

## 🧪 Testing Subscription Flow

**To test if new signups work:**

1. Go to your website (https://clickclickjob.com)
2. Find the subscription form
3. Enter a test email (use a different email, not yotamt@gmail.com)
4. Click Subscribe
5. Check MailerLite dashboard - should appear within seconds
6. Run sync script to update MongoDB
7. Test subscriber should receive Monday's digest

---

## 📊 Subscriber Statistics

### Check Stats in MailerLite:
1. Go to: https://dashboard.mailerlite.com/
2. Click "Subscribers" in left menu
3. See:
   - Total subscribers
   - Growth over time
   - Active vs unsubscribed
   - Subscriber sources
   - Geographic distribution

### Email Campaign Stats:
After Monday's send, check:
- Open rate (how many opened the email)
- Click rate (how many clicked job links)
- Bounce rate (invalid emails)
- Unsubscribe rate

---

## 🔧 Troubleshooting

### New Subscribers Not Showing Up?

1. **Check MailerLite dashboard** - Are they there?
   - If yes: Run sync script to update MongoDB
   - If no: Check subscribe API endpoint logs

2. **Test the subscription form:**
   ```bash
   # Test the API endpoint directly
   curl -X POST https://clickclickjob.com/api/subscribe \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","source":"test"}'
   ```

3. **Check environment variables:**
   - Verify MAILERLITE_API_KEY is set in Vercel
   - Verify MAILERLITE_GROUP_ID is set in Vercel

### MongoDB Out of Sync?

Run the sync script:
```bash
node scripts/import-mailerlite-subscribers.js
```

This pulls latest data from MailerLite (source of truth) to MongoDB.

---

## 📝 Quick Commands

```bash
# View all subscribers
node scripts/list-all-subscribers.js

# Sync MailerLite → MongoDB
node scripts/import-mailerlite-subscribers.js

# Check MongoDB subscribers
node scripts/check-subscribers.js

# Send test email to yourself only
node scripts/preview-production-email.js

# Send digest to all subscribers now
node scripts/send-to-all-subscribers-now.js
```

---

## 🎯 Summary

**✅ Fully Automatic:**
- New signups are handled automatically via your website
- Added to MailerLite instantly
- No manual work needed!

**📊 View Subscribers:**
- MailerLite dashboard (best option): https://dashboard.mailerlite.com/subscribers
- Local script: `node scripts/list-all-subscribers.js`
- MongoDB for advanced queries

**🔄 Keep in Sync:**
- Run `node scripts/import-mailerlite-subscribers.js` weekly
- Or after manual adds/removes in MailerLite

**📈 Current Count:** 5 active subscribers  
**💌 Next Send:** Monday, February 10, 2026 at 2 PM UTC

---

**Your subscriber system is fully automated!** People can sign up via your website, and they'll automatically start receiving Monday digests. You just need to check MailerLite dashboard occasionally to see growth. 🎉
