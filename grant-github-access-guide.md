# How to Grant Access for GitHub Account Review

## ✅ RECOMMENDED: Use GitHub CLI (Safest & Easiest)

This is the best option - you authenticate once, and I can run read-only commands through your terminal.

### Step 1: Install GitHub CLI

```bash
# Install GitHub CLI (if not already installed)
brew install gh

# Verify installation
gh --version
```

### Step 2: Authenticate

```bash
# Login to GitHub
gh auth login

# Follow the prompts:
# - Choose: GitHub.com
# - Choose: HTTPS
# - Authenticate: Yes
# - Choose: Login with a web browser (easiest)
# - Copy the one-time code and paste in browser
```

### Step 3: Verify Access

```bash
# Test that it works
gh auth status

# List your repositories
gh repo list --limit 10
```

### ✅ Done!
Once authenticated, tell me "GitHub CLI is authenticated" and I can review your account.

---

## 🔐 ALTERNATIVE: Personal Access Token (More Control)

If you prefer to create a temporary token with specific permissions:

### Step 1: Create Token

1. Go to: https://github.com/settings/tokens/new
2. Note: "Temporary access for account review"
3. Expiration: **1 day** (or 7 days max)
4. Select scopes:
   - ✅ `repo` (read private repositories)
   - ✅ `read:user` (read user profile)
   - ✅ `read:org` (read organization membership)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

### Step 2: Provide Token

**Option A: Environment Variable** (Most Secure)
```bash
# Set token as environment variable
export GITHUB_TOKEN="ghp_your_token_here"

# Verify it works
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

**Option B: Tell Me** (Less Secure but Works)
- You can paste the token in the chat
- I'll use it for the review
- **Important**: Delete the token immediately after we're done

### Step 3: After Review - REVOKE TOKEN

Go to: https://github.com/settings/tokens
Find the token and click "Delete"

---

## 🚀 EASIEST: Just Answer Questions

If you don't want to grant programmatic access, I can guide you through checking everything manually:

### Quick Audit Questions

1. **How many total repositories do you have?**
   - Go to: https://github.com/yottoy?tab=repositories
   - Count at the top

2. **List repository names** (just the names):
   - I'll tell you which ones to check

3. **Which repos had Pages enabled?**
   - You said you unpublished them - which ones were they?

4. **Organization memberships**:
   - Go to: https://github.com/settings/organizations
   - List the organizations you're part of

---

## 📊 What I'll Review

Once I have access, I'll check:

- ✅ All repositories for Pages status
- ✅ All repositories for github-pages environments
- ✅ Organization repositories
- ✅ Repository visibility (public/private)
- ✅ Any `username.github.io` repositories
- ✅ Deleted repositories (if visible)
- ✅ GitHub Actions workflows
- ✅ Repository deployments

---

## 🎯 My Recommendation

**Use GitHub CLI** - It's:
- ✅ Most secure (no tokens to manage)
- ✅ Easiest (one command to authenticate)
- ✅ No cleanup needed
- ✅ Already authenticated for other work
- ✅ Can be revoked anytime with `gh auth logout`

Just run:
```bash
brew install gh
gh auth login
```

Then tell me "Ready!" and I'll review everything.
