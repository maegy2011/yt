import { PrismaClient } from '@prisma/client'

// Debug logging utility for database operations
const debugLog = (component: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [DB:${component}] ${action}`, data ? data : '')
}

const debugError = (component: string, action: string, error: any) => {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] [DB:${component}] ERROR in ${action}:`, error)
}

const debugWarn = (component: string, action: string, warning: any) => {
  const timestamp = new Date().toISOString()
  console.warn(`[${timestamp}] [DB:${component}] WARNING in ${action}:`, warning)
}

// Create a singleton Prisma client instance that works in Next.js
let prismaClient: PrismaClient | null = null

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    // Explicitly set the database URL to ensure it's loaded correctly
    const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
    debugLog('PrismaClient', 'Initializing Prisma client', { databaseUrl })
    console.log('Initializing Prisma client with URL:', databaseUrl)
    
    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      },
      log: ['error', 'warn']
    })
    
    debugLog('PrismaClient', 'Prisma client initialized successfully')
  }
  return prismaClient
}

export const db = getPrismaClient()

// Helper function to ensure database is connected
export async function ensureDatabaseConnection() {
  try {
    debugLog('Database', 'Attempting to connect to database')
    await db.$connect()
    debugLog('Database', 'Database connected successfully')
    console.log('Database connected successfully')
    return true
  } catch (error) {
    debugError('Database', 'Database connection failed', error)
    console.error('Database connection failed:', error)
    return false
  }
}