# 🚀 GitHub Actions Setup - Automated Weekly Digest

## ✅ What We Just Did

Created a GitHub Actions workflow that:
- Runs **every Monday at 2 PM UTC** automatically
- Sends the weekly digest to all 5 subscribers
- Uses the same proven script that works locally
- **No Vercel involved!**

---

## 🔐 Step 1: Add Secrets to GitHub

You need to add 5 secrets to your GitHub repository:

### Go to GitHub:
1. Open: https://github.com/yottoy/remote-desk.work/settings/secrets/actions
2. Click **"New repository secret"** for each of these:

### Secrets to Add:

#### 1. MONGODB_URI
```
mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

#### 2. MONGODB_DB
```
clickclickjob
```

#### 3. SENDGRID_API_KEY
```
SG.your-sendgrid-api-key-here
```

#### 4. SENDGRID_FROM_EMAIL
```
hi@clickclickjob.com
```

#### 5. SENDGRID_FROM_NAME
```
ClickClickJob Team
```

---

## 🧪 Step 2: Test It Right Now

Once you've added the secrets, test it immediately:

1. Go to: https://github.com/yottoy/remote-desk.work/actions/workflows/weekly-digest.yml
2. Click **"Run workflow"** dropdown
3. Click the green **"Run workflow"** button
4. Wait 30 seconds
5. Check your email inbox!

You should see:
- ✅ Green checkmark in GitHub Actions
- 📧 Email in all 5 subscribers' inboxes

---

## 📅 Schedule

**Automatic runs:**
- **Every Monday at 2 PM UTC**
- 6 AM PST / 9 AM EST
- No manual intervention needed!

**Manual runs:**
- Click "Run workflow" button anytime
- Great for testing or sending extra digests

---

## 🔍 Monitoring

### Check if it worked:
1. Go to: https://github.com/yottoy/remote-desk.work/actions
2. Look for "Weekly Job Digest" workflow
3. Green ✅ = Success, Red ❌ = Failed

### View logs:
1. Click on any workflow run
2. Click "send-digest" job
3. See full output (subscriber count, jobs sent, etc.)

---

## ✅ Benefits vs Vercel Cron

| Feature | GitHub Actions | Vercel Cron |
|---------|----------------|-------------|
| **Setup** | 5 secrets | Complex auth + env vars |
| **Testing** | Click button in UI | Requires curl + auth token |
| **Monitoring** | Full logs in GitHub | Limited visibility |
| **Reliability** | Proven, simple | Auth issues, deployment deps |
| **Manual trigger** | One-click button | Terminal commands |
| **Cost** | Free (GitHub Actions) | Free (Vercel Hobby) |

---

## 🎯 Next Steps

1. **Add the 5 secrets to GitHub** (Step 1 above)
2. **Test it manually** (Step 2 above)
3. **Check your inbox** - you should get the email!
4. **Relax** - it will run automatically every Monday! 🎉

---

## 🐛 Troubleshooting

### If the test fails:
1. Check you added all 5 secrets correctly
2. View the error logs in GitHub Actions
3. Make sure secret names match exactly (case-sensitive!)

### If emails don't arrive:
1. Check spam folder
2. Verify SendGrid API key is valid
3. Check GitHub Actions logs for error messages

---

## 📊 What Each Run Does

```
1. Checkout code from GitHub
2. Install Node.js 18
3. Install mongodb + sendgrid packages
4. Load secrets as environment variables
5. Run send-to-all-subscribers-now.js
6. Send 10 fresh jobs to 5 subscribers
7. Report success/failure
```

**Time per run:** ~30 seconds  
**Cost:** $0 (GitHub Actions free tier)

---

## 🎉 That's It!

Once you add the secrets and test it, you're **100% automated**. Every Monday at 2 PM UTC, your subscribers get their weekly digest. No Vercel, no manual commands, no auth issues!

**Next automated send:** Monday, February 10, 2026 at 2 PM UTC
