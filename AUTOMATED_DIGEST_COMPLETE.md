# 🎉 Automated Weekly Digest - Complete Setup

## ✅ What's Built

A fully automated weekly email digest system that:
- ✅ Fetches latest 10 jobs from MongoDB every Monday
- ✅ Gets subscribers from MailerLite API  
- ✅ Sends beautiful HTML emails via SendGrid
- ✅ Sends from **hi@clickclickjob.com** (your custom domain)
- ✅ **100% FREE** (SendGrid free tier: 100 emails/day)
- ✅ Runs automatically via Vercel cron (no manual work!)

---

## 🚀 Setup Steps (10 minutes)

### Step 1: Create SendGrid Account (3 min)

1. Go to: **https://signup.sendgrid.com/**
2. Sign up (free account)
3. Verify your email

### Step 2: Generate API Key (2 min)

1. Go to: **https://app.sendgrid.com/settings/api_keys**
2. Click **"Create API Key"**
3. Name: `ClickClickJob Weekly Digest`
4. Permission: **"Full Access"**
5. **COPY THE KEY** (starts with `SG.`)

### Step 3: Verify Domain (5 min)

**Option A: Authenticate clickclickjob.com (Recommended)**

1. Go to: **https://app.sendgrid.com/settings/sender_auth**
2. Click **"Authenticate Your Domain"**
3. Enter: `clickclickjob.com`
4. Follow DNS setup instructions:
   - Add CNAME records to your DNS (Vercel/Cloudflare)
   - Wait 5-10 minutes for propagation
5. Once verified, you can send from `hi@clickclickjob.com`

**Option B: Single Sender Verification (Faster)**

1. Go to: **https://app.sendgrid.com/settings/sender_auth/senders**
2. Click **"Create New Sender"**
3. Fill in:
   - From Name: `ClickClickJob Team`
   - From Email: `hi@clickclickjob.com`
   - Reply To: `hi@clickclickjob.com`
   - Company, Address, etc.
4. **Verify via email sent to hi@clickclickjob.com**

### Step 4: Add to .env.local (1 min)

Edit `frontend/.env.local`:

```bash
SENDGRID_API_KEY=SG.your-actual-key-here
SENDGRID_FROM_EMAIL=hi@clickclickjob.com
SENDGRID_FROM_NAME=ClickClickJob Team
```

### Step 5: Test Locally (2 min)

```bash
cd /Users/yotamtroim/Library/Mobile\ Documents/com~apple~CloudDocs/Projects/remote-desk.work
node scripts/test-sendgrid-digest.js
```

This sends a test email to `yotamt@gmail.com`. Check your inbox (and spam)!

### Step 6: Deploy to Vercel (2 min)

```bash
cd frontend

# Add environment variables to Vercel
vercel env add SENDGRID_API_KEY production
# Paste your SendGrid API key

vercel env add SENDGRID_FROM_EMAIL production  
# Enter: hi@clickclickjob.com

vercel env add SENDGRID_FROM_NAME production
# Enter: ClickClickJob Team

# Deploy
vercel --prod
```

---

## 📧 How It Works

### Automatic Flow (Every Monday 2 PM UTC):

```
Monday 2 PM UTC
    ↓
Vercel Cron Triggers
    ↓
Fetch 10 Latest Jobs (MongoDB)
    ↓
Get Active Subscribers (MailerLite API)
    ↓
Generate Beautiful HTML Email
    ↓
Send via SendGrid (from hi@clickclickjob.com)
    ↓
✅ Done! Subscribers receive email
```

### What Each Service Does:

| Service | Purpose | Cost |
|---------|---------|------|
| **MailerLite** | Subscriber management (subscribe/unsubscribe) | $0 (free tier) |
| **SendGrid** | Email delivery (HTML emails) | $0 (free tier: 100/day) |
| **MongoDB** | Job storage | $0 (Atlas free tier) |
| **Vercel** | Hosting + Cron jobs | $0 (hobby tier) |

**Total Cost:** $0/month for up to 100 emails/day

---

## 🔄 Manual Trigger (Optional)

To send a digest manually anytime:

```bash
curl -X POST https://your-domain.vercel.app/api/digest/weekly \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

Or test locally:
```bash
cd frontend && npm run dev

# In another terminal:
curl -X POST http://localhost:3000/api/digest/weekly \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 📊 Monitoring

### Check Email Delivery:

1. **SendGrid Dashboard:**
   - https://app.sendgrid.com/statistics
   - See open rates, click rates, bounces

2. **Vercel Logs:**
   - https://vercel.com/your-project/logs
   - Filter by: `/api/digest/weekly`
   - See execution logs

3. **MailerLite:**
   - https://dashboard.mailerlite.com/subscribers
   - Track subscriber growth

### Email Analytics:

SendGrid tracks automatically:
- ✅ Delivery rate
- ✅ Open rate  
- ✅ Click rate
- ✅ Bounce rate
- ✅ Unsubscribe rate

---

## 🎨 Customize the Email

Edit: `frontend/utils/sendgridService.ts`

The `generateDigestHtml()` function contains the email template. Customize:
- Colors, fonts, layout
- Add more sections
- Change job card design
- Add images/logos

---

## 🐛 Troubleshooting

### "From address not verified"

**Solution:** Complete Step 3 above (domain authentication or single sender)

### "API key invalid"

**Solution:** Regenerate API key in SendGrid dashboard, update .env.local

### "No subscribers found"

**Check:**
- MailerLite has active subscribers
- MAILERLITE_API_KEY is correct
- MAILERLITE_GROUP_ID is correct

### "No jobs found"

**Check:**
- MongoDB has jobs with valid title, company, url
- Connection string is correct

### Emails going to spam

**Solutions:**
1. Authenticate your domain (Step 3 Option A)
2. Add SPF/DKIM records
3. Warm up your sender reputation (send gradually)
4. Avoid spam trigger words in subject

---

## 📈 Scaling Up

### When you reach 50+ subscribers:

**Option 1: Stay Free**
- SendGrid free tier: 100 emails/day
- You can handle up to ~400 weekly subscribers

### When you reach 100+ subscribers:

**Option 2: Upgrade SendGrid**
- Essentials plan: $19.95/mo (50,000 emails/month)
- Better deliverability
- Advanced analytics

**Option 3: Switch to AWS SES**
- Free tier: 62,000 emails/month
- $0.10 per 1,000 emails after
- More technical setup

---

## 🎯 Current Status

✅ **Code:** Complete and deployed  
✅ **Integration:** SendGrid + MailerLite + MongoDB  
✅ **Automation:** Vercel cron (Mondays 2 PM UTC)  
✅ **Cost:** $0/month  
⚠️  **Setup needed:** SendGrid account + domain verification  

---

## 📝 Next Steps

1. **Complete SendGrid setup** (Steps 1-3 above)
2. **Test locally** (Step 5)
3. **Deploy to Vercel** (Step 6)  
4. **Wait for Monday** or trigger manually
5. **Check yotamt@gmail.com** inbox
6. **Monitor analytics** in SendGrid dashboard

---

## 🎉 That's It!

Once setup is complete, the system runs automatically every Monday. You never have to manually send digests again!

**Questions?** Check the troubleshooting section or SendGrid docs.
