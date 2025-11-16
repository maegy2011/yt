import { PrismaClient } from '@prisma/client'

// Create a singleton Prisma client instance that works in Next.js
let prismaClient: PrismaClient | null = null

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    // Explicitly set the database URL to ensure it's loaded correctly
    const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
    console.log('Initializing Prisma client with URL:', databaseUrl)
    
    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      },
      log: ['error', 'warn']
    })
  }
  return prismaClient
}

export const db = getPrismaClient()

// Helper function to ensure database is connected
export async function ensureDatabaseConnection() {
  try {
    await db.$connect()
    console.log('Database connected successfully')
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}