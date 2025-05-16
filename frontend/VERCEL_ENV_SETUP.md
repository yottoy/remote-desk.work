# Vercel Environment Setup Guide

To properly deploy the application to Vercel, you need to set up the required environment variables.

## Required Environment Variables

1. **MONGODB_URI**: Your MongoDB connection string
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/database`
   - Make sure to include the full connection string with username, password and database

2. **MONGODB_DB**: Your MongoDB database name
   - Example: `clickclickjob`

## Steps to Set Up Environment Variables

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (clickclickjob)
3. Click on the "Settings" tab
4. In the left sidebar, click on "Environment Variables"
5. Add each of the required environment variables:
   - Add `MONGODB_URI` with your MongoDB connection string
   - Add `MONGODB_DB` with your database name
6. Make sure to select all environments where these variables should be available:
   - Production
   - Preview (optional)
   - Development (optional)
7. Click "Save" to apply the changes

## Testing the Deployment

After setting up the environment variables:

1. Go back to the "Deployments" tab
2. Click on "Redeploy" for your latest deployment
3. Wait for the build to complete
4. Visit your deployment URL to verify it's working properly

## Vercel Analytics

Vercel Analytics has been integrated into the application. To view analytics data:

1. Go to the "Analytics" tab in your Vercel dashboard
2. You'll see data for page views, user behavior, and performance metrics

## Troubleshooting

If you encounter build errors:

1. Check the build logs to identify the issue
2. Verify your environment variables are correctly set
3. Ensure your MongoDB connection string is valid and accessible from Vercel

For MongoDB connection issues, ensure:
- Your MongoDB server allows connections from Vercel IP addresses
- Your database user has the correct permissions
- Network access is properly configured in MongoDB Atlas (if using Atlas) 