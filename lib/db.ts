import { PrismaClient } from '@prisma/client'

// Database configuration with connection pooling
const DATABASE_CONFIG = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./db/custom.db'
    }
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
  // Connection pooling configuration for better performance
  __internal: {
    engine: {
      connectionLimit: 10, // Maximum number of connections
      poolTimeout: 10000,   // Connection timeout in ms
      connectTimeout: 10000, // Initial connection timeout
    },
  },
  // Enable query batching and caching for better performance
  transactionOptions: {
    timeout: 10000, // Transaction timeout in ms
    isolationLevel: 'ReadCommitted', // Balance between consistency and performance
  }
}

// Create a singleton Prisma client instance that works in Next.js
let prismaClient: PrismaClient | null = null

function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    // Explicitly set the database URL to ensure it's loaded correctly
    const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
    // Console statement removed
    
    prismaClient = new PrismaClient(DATABASE_CONFIG)
    
    // Graceful shutdown handling
    if (typeof window === 'undefined') {
      process.on('beforeExit', async () => {
        await prismaClient?.$disconnect()
      })
      process.on('SIGINT', async () => {
        await prismaClient?.$disconnect()
        process.exit(0)
      })
      process.on('SIGTERM', async () => {
        await prismaClient?.$disconnect()
        process.exit(0)
      })
    }
  }
  return prismaClient
}

// Export a function to get the database client instead of a direct instance
export function getDb() {
  try {
    return getPrismaClient()
  } catch (error) {
    // Console statement removed
    throw error
  }
}

// For backward compatibility, export the db instance
export const db = getDb()

// Enhanced helper function to ensure database is connected with performance metrics
export async function ensureDatabaseConnection() {
  const startTime = Date.now()
  try {
    const client = getDb()
    await client.$connect()
    
    // Test connection with a simple query
    await client.$queryRaw`SELECT 1`
    
    const connectionTime = Date.now() - startTime
    // Console statement removed
    
    return {
      connected: true,
      connectionTime,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    const connectionTime = Date.now() - startTime
    // Console statement removed
    return {
      connected: false,
      connectionTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

// Database performance monitoring utilities
export class DatabaseMonitor {
  static async getConnectionPoolStats() {
    try {
      const client = getDb()
      // Get basic connection info (SQLite specific)
      const result = await client.$queryRaw`PRAGMA database_list` as any[]
      return {
        activeConnections: result.length,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      // Console statement removed
      return null
    }
  }

  static async getDatabaseStats() {
    try {
      const client = getDb()
      const startTime = Date.now()
      
      // Get table row counts
      const [watchedCount, favoritesCount, notebookCount, notesCount] = await Promise.all([
        client.watchedVideo.count(),
        client.favoriteVideo.count(),
        client.notebook.count(),
        client.videoNote.count()
      ])
      
      const queryTime = Date.now() - startTime
      
      return {
        tables: {
          watchedVideos: watchedCount,
          favoriteVideos: favoritesCount,
          notebooks: notebookCount,
          videoNotes: notesCount
        },
        queryTime,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      // Console statement removed
      return null
    }
  }

  static async analyzeQueryPerformance<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<{ result: T; executionTime: number }> {
    const startTime = Date.now()
    try {
      const result = await queryFn()
      const executionTime = Date.now() - startTime
      
      if (executionTime > 1000) { // Log slow queries (> 1 second)
        // Console statement removed
      }
      
      return { result, executionTime }
    } catch (error) {
      const executionTime = Date.now() - startTime
      // Console statement removed
      throw error
    }
  }
}

// Query optimization utilities
export const optimizedQueries = {
  // Optimized video note queries with proper indexing
  async getVideoNotesByNotebook(notebookId: string, options?: {
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'updatedAt' | 'title';
    orderDirection?: 'asc' | 'desc';
  }) {
    const {
      limit = 50,
      offset = 0,
      orderBy = 'createdAt',
      orderDirection = 'desc'
    } = options || {}

    return DatabaseMonitor.analyzeQueryPerformance(
      `getVideoNotesByNotebook_${notebookId}`,
      async () => {
        const client = getDb()
        return client.videoNote.findMany({
          where: { notebookId },
          orderBy: { [orderBy]: orderDirection },
          take: limit,
          skip: offset,
          include: {
            notebook: {
              select: {
                id: true,
                title: true,
                color: true
              }
            }
          }
        })
      }
    )
  },

  // Optimized favorite videos with pagination
  async getFavoriteVideos(options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const { limit = 20, offset = 0, search } = options || {}

    return DatabaseMonitor.analyzeQueryPerformance(
      'getFavoriteVideos',
      async () => {
        const client = getDb()
        const where = search
          ? {
              OR: [
                { title: { contains: search } },
                { channelName: { contains: search } }
              ]
            }
          : undefined

        const [videos, total] = await Promise.all([
          client.favoriteVideo.findMany({
            where,
            orderBy: { addedAt: 'desc' },
            take: limit,
            skip: offset
          }),
          client.favoriteVideo.count({ where })
        ])

        return { videos, total, hasMore: offset + videos.length < total }
      }
    )
  },

  // Optimized watched videos with filtering
  async getWatchedVideos(options?: {
    limit?: number;
    offset?: number;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const { limit = 20, offset = 0, dateFrom, dateTo } = options || {}

    return DatabaseMonitor.analyzeQueryPerformance(
      'getWatchedVideos',
      async () => {
        const client = getDb()
        const where = {
          ...(dateFrom && { watchedAt: { gte: dateFrom } }),
          ...(dateTo && { watchedAt: { lte: dateTo } })
        }

        const [videos, total] = await Promise.all([
          client.watchedVideo.findMany({
            where,
            orderBy: { watchedAt: 'desc' },
            take: limit,
            skip: offset
          }),
          client.watchedVideo.count({ where })
        ])

        return { videos, total, hasMore: offset + videos.length < total }
      }
    )
  }
}