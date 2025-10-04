#!/bin/bash

echo "🚀 Setting up YouTube Islami for Vercel deployment..."
echo ""

# Check if we have PostgreSQL environment variables
if [ -z "$POSTGRES_PRISMA_URL" ] || [ -z "$POSTGRES_URL_NON_POOLING" ]; then
    echo "❌ PostgreSQL environment variables not found!"
    echo "Please set these environment variables:"
    echo "- POSTGRES_PRISMA_URL"
    echo "- POSTGRES_URL_NON_POOLING"
    echo "- POSTGRES_URL"
    echo ""
    echo "You can get these from Vercel Postgres or your PostgreSQL provider."
    exit 1
fi

echo "✅ PostgreSQL environment variables found!"

# Update Prisma schema to use PostgreSQL
SCHEMA_PATH="../prisma/schema.prisma"
if [ ! -f "$SCHEMA_PATH" ]; then
    echo "❌ Prisma schema file not found at $SCHEMA_PATH"
    exit 1
fi

# Backup original schema
cp "$SCHEMA_PATH" "$SCHEMA_PATH.backup"

# Uncomment PostgreSQL configuration using sed
sed -i '' 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA_PATH"
sed -i '' 's/url      = env("DATABASE_URL")/url      = env("POSTGRES_PRISMA_URL")/' "$SCHEMA_PATH"
sed -i '' '/^\/\/ For production on Vercel with PostgreSQL/,/^$/d' "$SCHEMA_PATH"

# Add PostgreSQL configuration
cat >> "$SCHEMA_PATH" << 'EOF'

  directUrl = env("POSTGRES_URL_NON_POOLING")
  shadowDatabaseUrl = env("POSTGRES_URL_NON_POOLING")
EOF

echo "✅ Updated Prisma schema to use PostgreSQL"

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    # Restore backup
    mv "$SCHEMA_PATH.backup" "$SCHEMA_PATH"
    exit 1
fi
echo "✅ Prisma client generated successfully"

# Push database schema
echo "🔄 Pushing database schema..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "❌ Failed to push database schema"
    # Restore backup
    mv "$SCHEMA_PATH.backup" "$SCHEMA_PATH"
    exit 1
fi
echo "✅ Database schema pushed successfully"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Deploy your application to Vercel"
echo "2. Visit /setup to create the admin account"
echo "3. Configure your YouTube API key in the admin dashboard"