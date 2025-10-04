import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with environment-specific configuration
const createPrismaClient = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isPostgres = process.env.POSTGRES_PRISMA_URL ? true : false
  
  if (isProduction && isPostgres) {
    // PostgreSQL configuration for Vercel
    return new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
      datasources: {
        db: {
          url: process.env.POSTGRES_PRISMA_URL!,
        }
      }
    })
  } else {
    // SQLite configuration for local development
    return new PrismaClient({
      log: ['query'],
    })
  }
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db