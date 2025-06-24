# ClickClickJob Deployment Guide

## 🚨 CRITICAL INFORMATION

### Correct Project Setup
- **Repository**: `yottoy/remote-desk.work`
- **Correct Vercel Project**: `clickclickjob` (NOT `remote-desk.work`)
- **Frontend Directory**: `/frontend/` (Next.js app is in subdirectory)
- **Working Live URL**: https://clickclickjob-13ed8xta7-yottoys-projects.vercel.app
- **Intended Custom Domain**: www.clickclickjob.com (needs DNS setup)

## 🛠 Quick Deployment Commands

### For Immediate Deployment (WORKING METHOD)
```bash
cd frontend
vercel --prod
```

### For Local Development
```bash
cd frontend  
npm run dev
# Site runs at http://localhost:3000
# NOTE: API calls to localhost:3004 will fail unless backend is running
```

## 📁 Project Structure
```
remote-desk.work/
├── frontend/           # Next.js application (THIS IS WHAT DEPLOYS)
│   ├── pages/
│   ├── components/
│   ├── package.json    # Contains Next.js dependencies
│   ├── vercel.json     # Frontend-specific Vercel config
│   └── ...
├── python-bridge/      # Backend API (separate deployment)
├── src/               # Backend utilities
├── vercel.json        # Root Vercel config (can cause conflicts)
└── DEPLOYMENT_GUIDE.md # This file
```

## 🐛 Issues We Encountered & Solutions

### Issue 1: All Deployments Returning 404
**Problem**: Site showing 404 on www.clickclickjob.com and Vercel URLs
**Root Cause**: Deploying wrong Vercel project (`remote-desk.work` instead of `clickclickjob`)
**Solution**: Deploy directly from frontend directory to correct project

### Issue 2: Import Path Errors
**Problem**: TypeScript error `Cannot find module '../../utils/jobUtils'`
**Root Cause**: Components importing from `../../utils/` but build looks in `../../src/utils/`
**Solution**: Changed imports from `../../utils/jobUtils` to `../../src/utils/jobUtils`

### Issue 3: GitHub Actions Workflow Failures  
**Problem**: "Cleanup Old Artifacts" workflow failing with permission errors
**Solution**: Disabled the workflow (commented out in `.github/workflows/cleanup-artifacts.yml`)

### Issue 4: Next.js Version Detection Error
**Problem**: "No Next.js version detected" during Vercel build
**Root Cause**: Conflicting `vercel.json` configurations and incorrect root directory setting
**Solution**: Removed conflicting Python bridge vercel.json and fixed root config

### Issue 5: Complex Rewrites Causing Routing Issues
**Problem**: Next.js rewrites in `next.config.js` interfering with normal routing
**Solution**: Simplified rewrites to only handle API routes

## ✅ Working Configuration Files

### Root `/vercel.json` (Current Working Config)
```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm run build",
  "devCommand": "cd frontend && npm run dev", 
  "installCommand": "cd frontend && npm install",
  "outputDirectory": "frontend/.next"
}
```

### Frontend `/frontend/vercel.json`
Contains production environment variables and routing rules.

## 🔧 Environment Variables
- `NEXT_PUBLIC_API_URL`: https://www.clickclickjob.com
- `NEXT_PUBLIC_SITE_URL`: https://www.clickclickjob.com  
- `MONGODB_DB`: clickclickjob
- Other sensitive variables in Vercel dashboard

## 🌐 Domain Setup (TODO)
To make www.clickclickjob.com work:
1. Go to Vercel dashboard → clickclickjob project
2. Add custom domain: www.clickclickjob.com
3. Update DNS records as instructed by Vercel

## 🚀 Deployment Checklist

### Before Deploying
- [ ] Ensure you're in the `frontend` directory
- [ ] Run `npm run build` to test locally
- [ ] Check that imports use `../../src/utils/` paths
- [ ] Verify environment variables are set in Vercel

### Deployment Steps
1. `cd frontend`
2. `vercel --prod`
3. Wait for deployment to complete
4. Test the generated Vercel URL
5. (Optional) Update custom domain if needed

### After Deployment
- [ ] Test homepage loads
- [ ] Test keyword pages (e.g., `/remote-data-entry-jobs-no-experience`)
- [ ] Test job listings work
- [ ] Check console for any errors

## 🆘 Troubleshooting

### If Deployment Fails
1. Check you're deploying from `frontend` directory
2. Ensure you're deploying to `clickclickjob` project, not `remote-desk.work`
3. Check build logs with `vercel logs <deployment-url>`
4. Verify Next.js dependencies in `frontend/package.json`

### If 404 Errors Occur
1. Confirm deployment succeeded (HTTP 200 on Vercel URL)
2. Check if custom domain DNS is properly configured
3. Clear browser cache / try incognito mode
4. Check for conflicting `vercel.json` files

### If Import Errors Occur
1. Verify all imports use `../../src/utils/` format for utilities
2. Check that imported files exist in the correct locations
3. Run local build to catch TypeScript errors

## 📝 Key Lessons Learned

1. **Always deploy from the correct directory** (`frontend/`)
2. **Use the correct Vercel project** (`clickclickjob`, not `remote-desk.work`)
3. **Import paths matter** - use `src/utils/` not `utils/`
4. **Multiple vercel.json files cause conflicts** - be careful with configurations
5. **Test locally first** - `npm run build` should succeed before deploying

## 📞 Emergency Recovery

If everything breaks:
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run build
vercel --prod
```

## 🔗 Important URLs
- **Working Live Site**: https://clickclickjob-13ed8xta7-yottoys-projects.vercel.app
- **Vercel Dashboard**: https://vercel.com/yottoys-projects/clickclickjob  
- **GitHub Repo**: https://github.com/yottoy/remote-desk.work
- **Local Dev**: http://localhost:3000

---
*Last Updated: June 24, 2025*
*Created after resolving deployment issues - keep this updated!* 