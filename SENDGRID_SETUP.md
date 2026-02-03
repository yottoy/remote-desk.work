# SendGrid Setup for ClickClickJob Weekly Digest

## Why SendGrid?

✅ **FREE tier:** 100 emails/day (you need 5/week = 0.7/day)  
✅ **Custom domain:** Send from hi@clickclickjob.com  
✅ **HTML emails:** Fully automated via API  
✅ **No plan restrictions:** Everything works on free tier  
✅ **MailerLite integration:** Keep MailerLite for subscriber management  

---

## Step 1: Create SendGrid Account (2 minutes)

1. Go to: **https://signup.sendgrid.com/**
2. Sign up with your email
3. Verify email address
4. Skip the "Tell us about yourself" (or fill if required)

---

## Step 2: Generate API Key (1 minute)

1. Go to: **https://app.sendgrid.com/settings/api_keys**
2. Click **"Create API Key"**
3. Name it: `ClickClickJob Weekly Digest`
4. **Permissions:** Select "Full Access" (or at minimum "Mail Send")
5. Click **"Create & View"**
6. **COPY THE KEY** (starts with `SG.`)
7. **SAVE IT** - you can't see it again!

---

## Step 3: Verify Domain (3 minutes)

### Option A: Verify clickclickjob.com (Recommended)

1. Go to: **https://app.sendgrid.com/settings/sender_auth/senders**
2. Click **"Verify a Single Sender"** OR **"Authenticate Your Domain"**
3. **For Domain Authentication:**
   - Enter: `clickclickjob.com`
   - Follow instructions to add DNS records:
     - Add CNAME records to your domain (Vercel, Cloudflare, etc.)
     - Wait 5-10 minutes for DNS propagation
4. Once verified, you can send from: `hi@clickclickjob.com`

### Option B: Use SendGrid Subdomain (Faster)

1. SendGrid provides: `@yourdomain.sendgrid.net`
2. Not as professional but works immediately
3. Or verify a Gmail address as sender (not recommended)

---

## Step 4: Add API Key to Environment

Add to `frontend/.env.local`:

```bash
SENDGRID_API_KEY=SG.your-key-here
SENDGRID_FROM_EMAIL=hi@clickclickjob.com
SENDGRID_FROM_NAME=ClickClickJob Team
```

Also add to **Vercel**:
```bash
vercel env add SENDGRID_API_KEY production
# Enter your key when prompted

vercel env add SENDGRID_FROM_EMAIL production  
# Enter: hi@clickclickjob.com

vercel env add SENDGRID_FROM_NAME production
# Enter: ClickClickJob Team
```

---

## Step 5: Test It

Run the test script:
```bash
cd /Users/yotamtroim/Library/Mobile\ Documents/com~apple~CloudDocs/Projects/remote-desk.work
node scripts/test-sendgrid-digest.js
```

This will send a test email to yotamt@gmail.com

---

## How It Works

### Weekly Automation Flow:

1. **Monday 2 PM UTC:** Vercel cron triggers
2. **Fetch jobs:** Latest 10 jobs from MongoDB
3. **Fetch subscribers:** From MailerLite API (keep using MailerLite for subscriber management)
4. **Generate HTML:** Beautiful job listing email
5. **Send via SendGrid:** To all subscribers from hi@clickclickjob.com
6. **Done:** ✅ Fully automated!

### What You Keep:

- ✅ MailerLite for subscriber management (subscribe/unsubscribe)
- ✅ MailerLite for analytics (optional)
- ✅ SendGrid for actual email sending (free, automated)

---

## Costs

- **SendGrid:** $0 (free tier 100 emails/day)
- **MailerLite:** $0 (free tier for subscribers)
- **Total:** $0/month

---

## Next Steps After Setup:

1. Get SendGrid API key
2. Verify clickclickjob.com domain
3. Add keys to .env.local
4. Test locally
5. Deploy to Vercel
6. Emails send automatically every Monday!
