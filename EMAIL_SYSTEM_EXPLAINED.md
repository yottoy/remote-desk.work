# 📧 Email System Architecture - Simple Explanation

## 🎯 Two Services, Two Jobs

Your email system uses **two services** that work together:

### 1. 📋 MailerLite = Subscriber Manager
**What it does:** Keeps track of who's subscribed

- Stores subscriber emails
- Handles signups from your website
- Manages unsubscribes
- Tracks subscriber status (active/unsubscribed)
- Provides dashboard to view subscribers

**What it does NOT do:** Send your weekly digest emails

---

### 2. ✉️ SendGrid = Email Sender
**What it does:** Actually sends the emails

- Sends the weekly digest HTML email
- Delivers to all subscribers' inboxes
- Handles email authentication (SPF/DKIM)
- Tracks delivery, bounces, opens
- From: hi@clickclickjob.com

**What it does NOT do:** Manage your subscriber list

---

## 🔄 How They Work Together

**When someone subscribes:**
1. User fills form on clickclickjob.com
2. `/api/subscribe` endpoint is called
3. **MailerLite** adds them to subscriber list
4. User receives confirmation email (from MailerLite)
5. They're now in the system!

**When Monday digest runs:**
1. GitHub Actions triggers at 2 PM UTC
2. Script fetches subscriber list from **MailerLite** API
3. Script fetches 10 fresh jobs from MongoDB
4. Script generates beautiful HTML email
5. **SendGrid** sends the email to all subscribers
6. Done! ✅

---

## 💡 Why Use Both?

**Why not just use MailerLite for everything?**

MailerLite's **free tier** has limitations:
- ❌ Can't create/send campaigns with custom HTML via API
- ❌ Can't programmatically generate email content
- ✅ BUT can manage subscribers for free!

**So we use MailerLite for what it's good at (free subscriber management)** and **SendGrid for what we need (free custom email sending)**.

---

## 📊 The Flow

```
Website Visitor
     ↓
Clicks "Subscribe"
     ↓
MailerLite API (adds to list)
     ↓
Subscriber stored in MailerLite
     ↓
[Wait until Monday 2 PM UTC]
     ↓
GitHub Actions runs
     ↓
Fetch subscribers from MailerLite
     ↓
Fetch jobs from MongoDB
     ↓
Generate email HTML
     ↓
SendGrid sends emails
     ↓
Subscribers receive digest! 📧
```

---

## 🆚 Service Comparison

| Feature | MailerLite | SendGrid |
|---------|------------|----------|
| **Manage subscribers** | ✅ Yes | ❌ No |
| **Signup forms** | ✅ Yes | ❌ No |
| **Handle unsubscribes** | ✅ Yes | ❌ No |
| **Dashboard UI** | ✅ Yes | ❌ No |
| **Send custom HTML emails via API** | ❌ No (paid) | ✅ Yes (free) |
| **Send from custom domain** | ❌ No (paid) | ✅ Yes (free) |
| **Weekly digest automation** | ❌ No (paid) | ✅ Yes (free) |
| **Cost** | Free | Free |

---

## 🔐 Which Stores What?

### MailerLite Stores:
- ✅ Subscriber emails
- ✅ Subscription dates
- ✅ Active/unsubscribed status
- ✅ Subscriber sources (website, manual, etc.)

### SendGrid Stores:
- ✅ Email delivery logs
- ✅ Bounce reports
- ✅ Open/click tracking
- ❌ Does NOT store subscriber list

### MongoDB Stores (backup):
- ✅ Copy of MailerLite subscribers
- ✅ Job listings
- ❌ Not used directly for sending emails

---

## 🎯 The "Source of Truth"

**For subscribers:** MailerLite is the source of truth

When the digest runs:
1. Fetch latest subscribers from MailerLite API
2. Send to those subscribers via SendGrid
3. MongoDB is just a backup/cache

This means:
- If someone unsubscribes in MailerLite → they stop getting emails ✅
- If someone signs up on your site → MailerLite adds them → they get next digest ✅

---

## 💰 Cost Breakdown

Both services are **free** for your usage:

### MailerLite Free Tier:
- ✅ 1,000 subscribers (you have 5)
- ✅ 12,000 emails/month (you send ~20/week)
- ✅ Unlimited signup forms
- ✅ Subscriber management dashboard

### SendGrid Free Tier:
- ✅ 100 emails/day (you send 5-10 per week)
- ✅ Custom domain sending
- ✅ API access
- ✅ Email analytics

**Total cost:** $0/month 🎉

---

## 🔧 Could You Use Just One Service?

**Could you use only MailerLite?**
- ❌ Not on free tier - would need $9/month plan for API campaign creation
- ❌ More complex to set up custom HTML emails
- ❌ Less control over email content

**Could you use only SendGrid?**
- ❌ Would need to build your own subscriber management system
- ❌ No built-in signup forms
- ❌ No built-in unsubscribe handling
- ❌ More complex subscriber management

**Using both = Best of both worlds! ✅**

---

## 📋 Quick Reference

**View subscribers:** https://dashboard.mailerlite.com/subscribers (MailerLite)  
**View email sends:** https://app.sendgrid.com/email_activity (SendGrid)  

**Add subscriber:** Happens automatically via MailerLite  
**Send email:** Happens automatically via SendGrid  

**Manage subscriptions:** MailerLite  
**Manage email delivery:** SendGrid  

---

## 🎉 Summary

Think of it like this:

**MailerLite = Your customer database**  
- Knows who's subscribed
- Manages signups/unsubscribes
- Provides subscriber dashboard

**SendGrid = Your email postal service**  
- Actually delivers the emails
- Handles email authentication
- Tracks delivery

**Together they create a powerful, free email system!** 🚀

---

## 🤔 Common Questions

**Q: Why not just use MailerLite's email campaigns?**  
A: Because on the free tier, you can't programmatically create/send campaigns with custom HTML via API. You'd have to manually create each email in their dashboard.

**Q: Do I need to pay for either service?**  
A: Nope! Both free tiers cover your needs unless you get 100+ subscribers or send daily emails.

**Q: What if someone unsubscribes?**  
A: MailerLite handles it automatically. They mark the subscriber as "unsubscribed," and our script fetches only "active" subscribers, so they stop getting emails.

**Q: What if I want to send a special email off-schedule?**  
A: Just run the manual script or click "Run workflow" in GitHub Actions. SendGrid will send it via MailerLite's subscriber list.

---

**Bottom line:** MailerLite manages the guest list, SendGrid delivers the invitations! 📧✨
