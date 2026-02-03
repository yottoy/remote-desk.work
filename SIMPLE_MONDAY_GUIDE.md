# 📧 Send Weekly Digest - Simple Guide

## Every Monday, Do This:

### Option 1: Let It Run Automatically ⏰
**If the cron job is working:**
- Do nothing! Emails send automatically at 2 PM UTC
- Check your inbox to verify you got the email
- If you didn't get it, go to Option 2

### Option 2: Send Manually (2 minutes) 🖱️
**If cron isn't working or you want to send it yourself:**

1. Open Terminal
2. Copy and paste these commands:

```bash
cd /Users/yotamtroim/Library/Mobile\ Documents/com~apple~CloudDocs/Projects/remote-desk.work
node scripts/send-to-all-subscribers-now.js
```

3. Wait 3 seconds
4. Done! ✅

---

## What You'll See:

```
📧 Sending Weekly Digest to ALL Subscribers

✅ Found 5 active subscribers

✅ Found 10 fresh jobs from last 7 days

✅ SUCCESS! Weekly digest sent to all subscribers!
```

---

## Check Your Inbox

Within 1-2 minutes, you and all 5 subscribers will receive:
- **Subject:** 🔔 10 New Remote Jobs This Week
- **From:** ClickClickJob Team <hi@clickclickjob.com>
- **Content:** 10 fresh jobs with links to your site

---

## That's It!

No need to understand the technical details. Just run those 2 commands every Monday and your subscribers get their weekly digest. 🎉
