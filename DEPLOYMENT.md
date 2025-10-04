# YT Islami Deployment Guide

## Environment Variables

Required environment variables for deployment:

### Database
- `DATABASE_URL` - SQLite database connection string (e.g., `file:./dev.db`)

### Authentication
- `JWT_SECRET` - Secret key for JWT token signing (generate a secure random string)

### YouTube Integration
- `YOUTUBE_API_KEY` - YouTube Data API v3 key for fetching video data

## Vercel Deployment

### Prerequisites
1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard

### Environment Variables Setup in Vercel
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - `DATABASE_URL` (e.g., `file:./dev.db`)
   - `JWT_SECRET` (generate a secure random string)
   - `YOUTUBE_API_KEY` (your YouTube API key)

### Build Configuration
The project is already configured for Vercel deployment:
- `package.json` includes `prisma generate` in the build script
- `vercel.json` is configured for optimal Next.js deployment
- `next.config.ts` is set to ignore build errors for smoother deployment

### First Run
After deployment:
1. Visit your domain - you'll be redirected to `/setup`
2. Follow the setup wizard to initialize the database
3. Create your admin account
4. Login with admin credentials to access the dashboard

### Default Admin Account
- Email: `admin@example.com`
- Password: `admin123`
- Role: ADMIN

## Database Setup

The system uses SQLite with Prisma ORM. The database will be automatically created during the setup process.

### Manual Database Setup (if needed)
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

## Security Notes

- Change the default admin password after first login
- Use a strong JWT_SECRET in production
- Keep your YouTube API key secure
- Regular backup of the SQLite database file

## Troubleshooting

### Build Issues
If you encounter Prisma-related build errors:
1. Ensure `prisma generate` runs before `next build`
2. Check that all environment variables are set
3. Verify the DATABASE_URL format

### Setup Issues
If setup page shows errors:
1. Check database connection string
2. Ensure write permissions for the database file
3. Verify all required environment variables are set

### Authentication Issues
If login fails:
1. Verify JWT_SECRET is set correctly
2. Check that admin account exists in database
3. Clear browser cookies and try again

## Production Considerations

1. **Database**: For production, consider using a more robust database like PostgreSQL
2. **File Storage**: The SQLite file should be stored in a persistent location
3. **Backups**: Implement regular database backups
4. **Monitoring**: Set up monitoring for YouTube API quota usage
5. **Security**: Use HTTPS and implement proper CORS policies