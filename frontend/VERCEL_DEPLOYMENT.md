# Deploying to Vercel

This guide explains how to deploy the ClickClickJob.com frontend to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. The [Vercel CLI](https://vercel.com/docs/cli) installed (optional)
3. A GitHub account with the repository pushed

## Option 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Import your GitHub repository

1. Login to your Vercel account
2. Click "Add New" > "Project"
3. Select the GitHub repository (yottoy/remote-desk.work)
4. Select the "frontend" directory as the Root Directory

### Step 2: Configure project settings

1. Framework Preset: Next.js
2. Root Directory: frontend
3. Build Command: npm run build
4. Output Directory: build
5. Install Command: npm ci

### Step 3: Configure environment variables

Add the following environment variables:
- `API_URL`: URL to your backend API (e.g., https://api.clickclickjob.com/api)
- `SITE_NAME`: ClickClickJob.com
- `NEXT_PUBLIC_SITE_URL`: Your frontend URL (e.g., https://clickclickjob.com)

### Step 4: Deploy

Click "Deploy" and wait for the build process to complete.

## Option 2: Deploy via Vercel CLI

### Step 1: Login to Vercel CLI

```bash
vercel login
```

### Step 2: Navigate to the frontend directory

```bash
cd frontend
```

### Step 3: Deploy to Vercel

```bash
vercel --prod
```

Follow the CLI prompts to complete deployment.

## Post-Deployment Tasks

After successful deployment, perform these checks:

1. Verify all pages load correctly
2. Check navigation and links
3. Test job search functionality
4. Test mobile responsiveness
5. Verify API integration works correctly

## Setting up Custom Domain

1. In the Vercel dashboard, go to your project
2. Click on "Settings" > "Domains"
3. Add your domain (e.g., clickclickjob.com)
4. Follow Vercel's instructions to set up DNS records

## Continuous Deployment

Vercel automatically sets up continuous deployment from your GitHub repository. Any push to the main branch will trigger a new deployment.

To customize this behavior:
1. Go to the Vercel dashboard
2. Select your project
3. Navigate to "Settings" > "Git"
4. Configure production branch and deploy hooks as needed

## Troubleshooting

### Build Failures

If your build fails, check:
1. The Vercel build logs for specific errors
2. That all dependencies are correctly specified in package.json
3. That you haven't exceeded Vercel's build limits

### API Connection Issues

If the frontend can't connect to your API:
1. Verify your API is running and accessible
2. Check the API_URL environment variable
3. Ensure CORS is properly configured on your backend

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Troubleshooting Vercel Deployments](https://vercel.com/guides/troubleshooting-nextjs-deployments) 