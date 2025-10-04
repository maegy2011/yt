#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up YouTube Islami for Vercel deployment...\n');

// Check if we have PostgreSQL environment variables
const hasPostgresEnv = process.env.POSTGRES_PRISMA_URL && process.env.POSTGRES_URL_NON_POOLING;

if (!hasPostgresEnv) {
  console.log('❌ PostgreSQL environment variables not found!');
  console.log('Please set these environment variables:');
  console.log('- POSTGRES_PRISMA_URL');
  console.log('- POSTGRES_URL_NON_POOLING');
  console.log('- POSTGRES_URL');
  console.log('\nYou can get these from Vercel Postgres or your PostgreSQL provider.');
  process.exit(1);
}

console.log('✅ PostgreSQL environment variables found!');

// Update Prisma schema to use PostgreSQL
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Uncomment PostgreSQL configuration
schemaContent = schemaContent.replace(
  /datasource db \{[\s\S]*?\}/,
  `datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
  shadowDatabaseUrl = env("POSTGRES_URL_NON_POOLING")
}`
);

fs.writeFileSync(schemaPath, schemaContent);
console.log('✅ Updated Prisma schema to use PostgreSQL');

try {
  // Generate Prisma client
  console.log('🔄 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated successfully');

  // Push database schema
  console.log('🔄 Pushing database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database schema pushed successfully');

  console.log('\n🎉 Setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Deploy your application to Vercel');
  console.log('2. Visit /setup to create the admin account');
  console.log('3. Configure your YouTube API key in the admin dashboard');

} catch (error) {
  console.error('❌ Error during setup:', error.message);
  process.exit(1);
}