# 🚀 ماي يوتيوب - Deployment Guide

## Overview
This guide will help you deploy the ماي يوتيوب (My YouTube) application to Vercel. The application is a YouTube-like web interface built with Next.js 15 and TypeScript.

## Prerequisites

### 1. YouTube Data API v3 Key
Before deploying, you need to obtain a YouTube Data API v3 key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create API credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API key"
   - Copy the API key (it will look like: `AIzaSyB...`)
5. **Important**: Restrict your API key:
   - Click on your API key
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"
   - Click "Save"

### 2. GitHub Repository
Make sure your code is pushed to a GitHub repository:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Deployment Steps

### 1. Connect to Vercel

#### Option A: Through GitHub (Recommended)
1. Go to [Vercel](https://vercel.com)
2. Sign up or log in
3. Click "New Project"
4. Select your GitHub repository
5. Click "Import"

#### Option B: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### 2. Configure Environment Variables

In your Vercel project dashboard:

1. Go to "Settings" > "Environment Variables"
2. Add the following environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `YOUTUBE_API_KEY` | `your_actual_api_key_here` | Your YouTube Data API v3 key |
| `NEXTAUTH_SECRET` | `generate_a_random_string` | Generate a random secret |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel app URL |

**Important**: Replace `your_actual_api_key_here` with your actual YouTube API key.

### 3. Configure Build Settings

Vercel will automatically detect that this is a Next.js project and use the following settings:

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4. Deploy

Click "Deploy" to start the deployment process. Vercel will:

1. Install dependencies
2. Build the application
3. Deploy to their global CDN

## Post-Deployment Checks

### 1. Test the Application

Once deployed, test these endpoints:

#### API Status Check
```bash
curl https://your-app.vercel.app/api/youtube/status
```

Expected response:
```json
{
  "youtubeApiKey": "Configured",
  "apiKeyLength": 39,
  "apiKeyPrefix": "AIzaSyB...",
  "environment": "production",
  "timestamp": "2025-10-11T17:30:00.000Z",
  "apiTest": {
    "status": 200,
    "ok": true,
    "statusText": "OK",
    "resultCount": 1
  }
}
```

#### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-11T17:30:00.000Z",
  "uptime": "1h 30m",
  "version": "0.1.0"
}
```

### 2. Test Main Features

1. **Homepage**: Visit `https://your-app.vercel.app`
2. **Search**: Try searching for videos
3. **Categories**: Test trending and popular videos
4. **Video Player**: Click on a video to open the player

### 3. Monitor Performance

Check your Vercel dashboard for:
- Build times
- Response times
- Error rates
- Bandwidth usage

## Troubleshooting

### Common Issues

#### 1. YouTube API Errors
If you see API errors like "400 Bad Request":

- **Check your API key**: Make sure it's valid and not restricted
- **Verify API is enabled**: Ensure YouTube Data API v3 is enabled in Google Cloud Console
- **Check quota**: YouTube API has daily quotas, monitor usage
- **Test API key**: Use the status endpoint to verify your API key works

#### 2. Build Failures
If the build fails:

- **Check logs**: View build logs in Vercel dashboard
- **Dependencies**: Ensure all dependencies are properly installed
- **TypeScript errors**: Fix any TypeScript errors
- **Environment variables**: Make sure all required variables are set

#### 3. Memory Issues
If you encounter memory-related errors:

- **Optimize images**: Use WebP format where possible
- **Lazy loading**: Implement lazy loading for videos
- **Caching**: Use appropriate cache headers
- **Monitor usage**: Keep an eye on memory usage in Vercel dashboard

### Debug Commands

#### Check API Status
```bash
curl https://your-app.vercel.app/api/youtube/status
```

#### Check Health
```bash
curl https://your-app.vercel.app/api/health
```

#### Test Search
```bash
curl "https://your-app.vercel.app/api/youtube/search?q=test"
```

## Maintenance

### 1. Monitor API Usage
- Check Google Cloud Console for API usage
- Monitor quotas and billing
- Set up alerts for high usage

### 2. Update Dependencies
Regularly update dependencies:
```bash
npm update
npm audit fix
```

### 3. Backup
- Keep your GitHub repository updated
- Backup environment variables
- Document any custom configurations

## Cost Optimization

### 1. Vercel
- Use the Hobby plan for personal projects
- Monitor bandwidth usage
- Optimize images and assets

### 2. YouTube API
- The free tier includes 10,000 requests/day
- Implement caching to reduce API calls
- Use appropriate cache headers

### 3. Database
- If using a database, optimize queries
- Use connection pooling
- Monitor database performance

## Support

If you encounter issues:

1. Check the [troubleshooting guide](./TROUBLESHOOTING.md)
2. Review Vercel documentation
3. Check YouTube Data API documentation
4. Create an issue in your GitHub repository

## Conclusion

Your ماي يوتيوب application is now ready for deployment! Follow these steps carefully, and you'll have a fully functional YouTube-like application running on Vercel.

Remember to:
- Keep your API keys secure
- Monitor usage and costs
- Keep dependencies updated
- Test thoroughly after deployment

Good luck with your deployment! 🚀