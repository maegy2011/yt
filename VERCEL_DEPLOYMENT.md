# Vercel Deployment Guide for YouTube Islami

## Database Configuration

### Option 1: Vercel Postgres (Recommended)

1. **Set up Vercel Postgres:**
   - Go to your Vercel project dashboard
   - Navigate to the "Storage" tab
   - Create a new Postgres database
   - Once created, Vercel will provide you with environment variables

2. **Environment Variables:**
   Vercel will automatically add these environment variables to your project:
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_URL`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

3. **Update Prisma Schema:**
   Uncomment the PostgreSQL configuration in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("POSTGRES_PRISMA_URL")
     directUrl = env("POSTGRES_URL_NON_POOLING")
     shadowDatabaseUrl = env("POSTGRES_URL_NON_POOLING")
   }
   ```

4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

5. **Push Database Schema:**
   ```bash
   npx prisma db push
   ```

### Option 2: External PostgreSQL Database

If you prefer to use an external PostgreSQL database (like Supabase, Neon, etc.):

1. **Get Database Connection String:**
   Obtain your PostgreSQL connection string from your database provider.

2. **Set Environment Variables:**
   In your Vercel project settings, add these environment variables:
   ```
   POSTGRES_PRISMA_URL=postgresql://username:password@host:port/database?pgbouncer=true
   POSTGRES_URL_NON_POOLING=postgresql://username:password@host:port/database
   POSTGRES_URL=postgresql://username:password@host:port/database
   ```

3. **Update Prisma Schema:**
   Same as Option 1, uncomment the PostgreSQL configuration.

4. **Generate and Push:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## Environment Variables Setup

In your Vercel project dashboard, add these environment variables:

### Required Variables:
- `NODE_ENV`: `production`
- `POSTGRES_PRISMA_URL`: (provided by Vercel Postgres or your database)
- `POSTGRES_URL_NON_POOLING`: (provided by Vercel Postgres or your database)
- `POSTGRES_URL`: (provided by Vercel Postgres or your database)

### Optional Variables:
- `YOUTUBE_API_KEY`: Your YouTube Data API v3 key
- `NEXTAUTH_SECRET`: A random secret string for authentication

## Deployment Steps

1. **Connect Your Repository:**
   - Link your GitHub repository to Vercel
   - Vercel will automatically detect the Next.js project

2. **Configure Environment Variables:**
   - Go to your project settings
   - Add all the required environment variables listed above

3. **Update Prisma Schema:**
   - Modify `prisma/schema.prisma` to use PostgreSQL (uncomment the lines)

4. **Build and Deploy:**
   - Vercel will automatically build and deploy your application
   - If the build fails, check the logs for database connection errors

5. **Run Database Migration:**
   After deployment, you need to create the database schema:
   ```bash
   # Install Vercel CLI if not already installed
   npm i -g vercel

   # Run database push
   vercel env pull .env
   npx prisma db push
   ```

## Troubleshooting

### Common Issues:

1. **Database Connection Errors:**
   - Ensure all environment variables are correctly set
   - Check that your database allows connections from Vercel's IP addresses
   - Verify the database connection string format

2. **Prisma Generation Errors:**
   - Make sure you're using the correct database provider in the schema
   - Run `npx prisma generate` locally before deploying

3. **Build Errors:**
   - Check that all dependencies are properly installed
   - Ensure the Prisma client is generated for the correct database provider

4. **Admin Creation Issues:**
   - After deployment, visit `/setup` to create the admin account
   - If you get "Admin account already exists" error, you may need to reset the database

### Debug Commands:

To debug database issues, you can run:

```bash
# Check environment variables
vercel env ls

# Test database connection
npx prisma db execute --stdin --preview-feature
```

## Local Development

To maintain local development with SQLite:

1. **Keep .env file for local development:**
   ```
   DATABASE_URL="file:./dev.db"
   NODE_ENV="development"
   ```

2. **Use different schema files (optional):**
   You can maintain separate schema files for development and production.

3. **Switch between databases:**
   - Comment/uncomment the appropriate datasource configuration in `prisma/schema.prisma`
   - Run `npx prisma generate` after switching

## Production Considerations

1. **Database Security:**
   - Use connection pooling for better performance
   - Enable SSL for database connections
   - Use strong passwords and rotate them regularly

2. **Performance:**
   - Monitor database query performance
   - Use Vercel's edge functions for better caching
   - Implement proper database indexing

3. **Backups:**
   - Enable automatic backups for your PostgreSQL database
   - Test backup restoration regularly

4. **Monitoring:**
   - Set up alerts for database connection issues
   - Monitor API quota usage
   - Track error rates and performance metrics