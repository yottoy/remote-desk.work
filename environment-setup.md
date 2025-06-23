# 🔧 Environment Variables Setup for Production

## Required Environment Variables

### Database Configuration
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/clickclickjob
MONGODB_DB=clickclickjob
```

### Authentication
```
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
```

### Email Service
```
EMAIL_USER=daily.app.2024@gmail.com
EMAIL_PASS=***REMOVED***
```

### Frontend URLs
```
FRONTEND_URL=https://www.clickclickjob.com
NEXT_PUBLIC_API_URL=https://www.clickclickjob.com
NEXT_PUBLIC_SITE_URL=https://www.clickclickjob.com
```

### Security
```
CRON_SECRET=***REMOVED***
NODE_ENV=production
```

## Vercel Environment Variables Setup

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable above with production values

## Local Development Setup

Create `.env.local` file:
```bash
cp environment-setup.template .env.local
# Edit .env.local with your development values
```

## Production Checklist

- [ ] MongoDB Atlas cluster configured
- [ ] All environment variables set in Vercel
- [ ] Email credentials working
- [ ] JWT secret is secure (32+ characters)
- [ ] Frontend URLs point to production domain
- [ ] CORS settings configured
- [ ] Rate limiting enabled 