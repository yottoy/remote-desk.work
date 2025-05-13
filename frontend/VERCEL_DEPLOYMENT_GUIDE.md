# ClickClickJob.com Vercel Deployment Guide

This document provides specific instructions for deploying the ClickClickJob.com frontend to Vercel.

## Pre-Deployment Checklist

- [x] Date serialization utilities added
- [x] API health check endpoint created
- [x] vercel.json configuration file added
- [x] Frontend properly structured for Next.js deployment

## Deployment Steps

1. **Configure Project in Vercel Dashboard**

   After connecting your GitHub repository to Vercel, use these specific settings:

   - **Project Name**: clickclickjob
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm ci`
   - **Development Command**: `npm run dev`

2. **Environment Variables**

   Add these environment variables in the Vercel project settings:

   ```
   API_URL=https://api.clickclickjob.com/api
   SITE_NAME=ClickClickJob.com
   NEXT_PUBLIC_SITE_URL=https://clickclickjob.com
   ```

   For initial deployment, you can use a temporary API URL if the backend isn't deployed yet:
   ```
   API_URL=/api
   ```

3. **Deploy**

   Click "Deploy" and wait for the build process to complete.
   
4. **Verify Deployment**

   After deployment, check these endpoints:
   
   - Health Check: `https://your-vercel-url.vercel.app/api/health`
   - Home Page: `https://your-vercel-url.vercel.app/`

## Connect Custom Domain

1. Go to the Vercel project settings
2. Click on "Domains"
3. Add your domain (e.g., clickclickjob.com)
4. Follow the instructions to configure your DNS settings

## Setting Up Production Backend

Once you have deployed your backend API:

1. Go to the Vercel project settings
2. Navigate to "Environment Variables"
3. Update the `API_URL` to point to your production backend
4. Redeploy the application

## Troubleshooting

### Date-related Errors

If you encounter date serialization issues:
- Verify that all date fields are being processed through the `serializeObject` utility
- Check the console for any serialization errors
- Ensure all API responses with dates are properly handled

### API Connection Issues

If the frontend can't connect to your API:
- Check that the API_URL environment variable is correctly set
- Verify your backend API is running and accessible
- Check for CORS issues (the backend needs to allow requests from your Vercel domain)

### Build Failures

Common causes of build failures:
- Missing dependencies in package.json
- TypeScript errors
- Incompatible package versions

Check the Vercel build logs for detailed error information.

## Automated Deployments

Vercel automatically deploys when changes are pushed to the main branch of your GitHub repository. You can customize this behavior in the Vercel project settings under "Git Integration". 