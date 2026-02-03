# Gmail SMTP Setup for Email Sending

## Quick Setup (5 minutes)

### Step 1: Generate Gmail App Password

1. Go to: **https://myaccount.google.com/apppasswords**
2. Sign in with: `daily.app.2024@gmail.com`
3. Click "Create" or "Generate app password"
4. Name it: `ClickClickJob` or `Digest Email`
5. Click "Create"
6. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 2: Add to .env.local

Open `frontend/.env.local` and replace this line:

```bash
EMAIL_PASS=YOUR_GMAIL_APP_PASSWORD_HERE
```

With:

```bash
EMAIL_PASS=abcdefghijklmnop
```

(Remove the spaces from the password)

### Step 3: Test Email Sending

```bash
cd /Users/yotamtroim/Library/Mobile\ Documents/com~apple~CloudDocs/Projects/remote-desk.work
node scripts/test-single-subscriber.js
```

This will send a test email to `yotamt@gmail.com`

---

## Alternative: Use Existing Password

If you already have an app password for `daily.app.2024@gmail.com`:

1. Find it in your password manager or Google settings
2. Add it to `frontend/.env.local`:
   ```bash
   EMAIL_PASS=your-existing-app-password
   ```

---

## Troubleshooting

### "Invalid credentials" error

**Solution:** Generate a new app password
- Old passwords may have expired
- Go to: https://myaccount.google.com/apppasswords
- Delete old "ClickClickJob" password
- Create a new one

### "Less secure app" error

**Solution:** Use app-specific password (not your main Gmail password)
- Never use your main Gmail password
- Always use app-specific passwords from the link above

### Can't access app passwords

**Requirements:**
- 2-Factor Authentication must be enabled
- Must be account owner (not managed/workspace account)

**If you can't enable:**
- Use SendGrid (free 100 emails/day)
- Use AWS SES (free 62,000 emails/month)

---

## After Setup

Once `EMAIL_PASS` is set, you can:

1. **Test locally:**
   ```bash
   node scripts/test-single-subscriber.js
   ```

2. **Add to Vercel:** (for production cron)
   ```bash
   cd frontend
   vercel env add EMAIL_USER production
   # Enter: daily.app.2024@gmail.com
   
   vercel env add EMAIL_PASS production
   # Paste your app password
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

---

## Current Status

- ✅ `EMAIL_USER` set to: `daily.app.2024@gmail.com`
- ⚠️  `EMAIL_PASS` needs your app password
- ⚠️  Need to add to Vercel for production

**Next step:** Generate app password and add it to `.env.local`
