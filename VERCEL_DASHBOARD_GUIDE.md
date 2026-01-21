# Vercel Dashboard Configuration Guide

## Finding Root Directory Setting

### Option 1: Settings → General

1. Go to: https://vercel.com/dashboard
2. Click on your project: `remote-desk.work`
3. Click: **Settings** tab (top navigation)
4. Look for: **Build & Development Settings** section
5. You should see:
   - **Framework Preset**: Next.js
   - **Root Directory**: (edit button here)
   - **Build Command**: (should be empty or auto-detected)
   - **Output Directory**: (should be empty or auto-detected)

### Option 2: If You Don't See Root Directory

The setting might be hidden if Vercel auto-detected the wrong configuration.

**Try This**:
1. Settings → General
2. Scroll to: **Build & Development Settings**
3. Click: **Override** toggle (if you see it)
4. This will reveal additional fields including Root Directory

### Option 3: Project Settings → Git

Sometimes it's under:
1. Settings → Git
2. Look for **Root Directory** or **Project Directory**

## Current Configuration We Need

```
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

## If You Still Can't Find It

Take a screenshot of your Settings page and I'll help identify where it is in your specific Vercel dashboard version.



