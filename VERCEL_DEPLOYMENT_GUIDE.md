# Vercel Deployment Guide for ClickClickJob

## Path Issue Resolution

We've fixed the path issue by placing the vercel.json file directly in the frontend directory and using simpler configuration settings.

## Environment Variables

Before deploying, you need to set up the following environment variables in your Vercel project:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your ClickClickJob project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables manually:
   - `MONGODB_URI`: Your MongoDB connection string (do NOT use @mongodb-uri reference)
   - `MONGODB_DB`: "clickclickjob" (or your MongoDB database name)

## Deployment Options

You can deploy in one of two ways:

### Option 1: Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select "New Project"
3. Import your git repository
4. Configure the following settings:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add the environment variables listed above
6. Click "Deploy"

### Option 2: CLI Deployment

Run the deployment script from the repository root:

```bash
./deploy-frontend.sh
```

This script will:
1. Navigate to the frontend directory
2. Run the Vercel CLI deployment

Note: You'll need to set up the environment variables in the Vercel dashboard regardless of which deployment method you choose.

## Verification

After deployment, verify that:
1. The site loads correctly
2. MongoDB connections work properly
3. Job listings and filtering features function as expected 