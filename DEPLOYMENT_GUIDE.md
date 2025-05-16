# ClickClickJob Deployment Guide

This guide explains how to deploy the ClickClickJob frontend application to Vercel with Analytics enabled.

## Prerequisites

- A Vercel account connected to your GitHub repository
- MongoDB database (for production)

## Step 1: Configure Environment Variables in Vercel

Before deploying, you need to set up the following environment variables in your Vercel project:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your ClickClickJob project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `MONGODB_DB`: Your MongoDB database name

For local development, you can create a `.env.local` file with these variables (do not commit this file).

## Step 2: Deploy Using the Script

We've created a deployment script that handles the deployment process:

```bash
./deploy.sh
```

This script will:
1. Check if required environment variables are set locally
2. Run a local build to catch any errors
3. Deploy to Vercel in production mode

Alternatively, you can deploy manually:

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Deploy to production
vercel --prod
```

## Step 3: Verify Your Deployment

After deployment:

1. Check your live application at the provided URL
2. Verify Vercel Analytics is working by visiting the Analytics tab in your Vercel dashboard
3. Test the application's functionality, especially job listings and filters

## Step 4: Monitor Analytics

Vercel Analytics provides valuable insights into:

- Page views and unique visitors
- User engagement metrics
- Performance data
- Error tracking

Access these metrics from the **Analytics** tab in your Vercel project dashboard.

## Troubleshooting

If your deployment fails, check:

1. Build logs in Vercel dashboard
2. TypeScript errors in your codebase
3. Environment variables are correctly set
4. MongoDB connection is working

## Continuous Deployment

Your app is set up for continuous deployment. Any push to the main branch will trigger a new deployment automatically.

## Manual Redeployment

If you need to manually trigger a redeployment:

1. Go to your Vercel dashboard
2. Select your project
3. Click the "Redeploy" button in the top right
4. Choose "Redeploy from Production" option 