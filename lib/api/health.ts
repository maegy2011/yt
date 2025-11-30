import { NextRequest, NextResponse } from 'next/server'
import { db, ensureDatabaseConnection, DatabaseMonitor } from '@/lib/db'
import { createApiContext, createSuccessResponse, createErrorResponse } from './middleware'

// Health check response interface
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  environment: string
  services: {
    database: ServiceStatus
    api: ServiceStatus
    memory: ServiceStatus
    disk: ServiceStatus
  }
  metrics: {
    requests: {
      total: number
      success: number
      error: number
      averageResponseTime: number
    }
    memory: {
      used: number
      total: number
      percentage: number
    }
  }
}

interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime?: number
  error?: string
  lastCheck: string
}

// In-memory metrics store (for production, consider Redis or database)
const metricsStore = {
  requests: {
    total: 0,
    success: 0,
    error: 0,
    responseTimes: [] as number[]
  },
  startTime: Date.now()
}

// Application start time
const APP_START_TIME = Date.now()

// Check database health with enhanced monitoring
async function checkDatabaseHealth(): Promise<ServiceStatus> {
  const startTime = Date.now()
  
  try {
    // Enhanced database connection test with metrics
    const connectionStatus = await ensureDatabaseConnection()
    
    if (!connectionStatus.connected) {
      return {
        status: 'unhealthy',
        error: 'Database connection failed',
        lastCheck: new Date().toISOString()
      }
    }

    // Get database performance metrics
    const [dbStats, poolStats] = await Promise.all([
      DatabaseMonitor.getDatabaseStats(),
      DatabaseMonitor.getConnectionPoolStats()
    ])

    // Test query performance
    const queryTest = await DatabaseMonitor.analyzeQueryPerformance('health_check_query', async () => {
      return db.$queryRaw`SELECT COUNT(*) as count FROM WatchedVideo LIMIT 1`
    })

    const responseTime = Date.now() - startTime
    
    // Determine health status based on performance
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (queryTest.executionTime > 5000) { // > 5 seconds is unhealthy
      status = 'unhealthy'
    } else if (queryTest.executionTime > 2000) { // > 2 seconds is degraded
      status = 'degraded'
    }

    return {
      status,
      responseTime: queryTest.executionTime,
      lastCheck: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed',
      lastCheck: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }
  }
}

// Check API health
function checkApiHealth(): ServiceStatus {
  const averageResponseTime = metricsStore.requests.responseTimes.length > 0
    ? metricsStore.requests.responseTimes.reduce((a, b) => a + b, 0) / metricsStore.requests.responseTimes.length
    : 0
  
  const errorRate = metricsStore.requests.total > 0
    ? (metricsStore.requests.error / metricsStore.requests.total) * 100
    : 0
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  
  if (errorRate > 10) {
    status = 'unhealthy'
  } else if (errorRate > 5 || averageResponseTime > 2000) {
    status = 'degraded'
  }
  
  return {
    status,
    responseTime: averageResponseTime,
    lastCheck: new Date().toISOString()
  }
}

// Check memory health
function checkMemoryHealth(): ServiceStatus {
  const memoryUsage = process.memoryUsage()
  const totalMemory = memoryUsage.heapTotal + memoryUsage.external
  const usedMemory = memoryUsage.heapUsed
  const memoryPercentage = (usedMemory / totalMemory) * 100
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  
  if (memoryPercentage > 90) {
    status = 'unhealthy'
  } else if (memoryPercentage > 75) {
    status = 'degraded'
  }
  
  return {
    status,
    lastCheck: new Date().toISOString()
  }
}

// Check disk health (simplified)
function checkDiskHealth(): ServiceStatus {
  // This is a simplified check - in production you might want to check actual disk space
  return {
    status: 'healthy',
    lastCheck: new Date().toISOString()
  }
}

// Record request metrics
export function recordRequestMetrics(success: boolean, responseTime: number): void {
  metricsStore.requests.total++
  
  if (success) {
    metricsStore.requests.success++
  } else {
    metricsStore.requests.error++
  }
  
  // Keep only last 1000 response times for average calculation
  metricsStore.requests.responseTimes.push(responseTime)
  if (metricsStore.requests.responseTimes.length > 1000) {
    metricsStore.requests.responseTimes.shift()
  }
}

// Get overall health status
function getOverallHealth(services: HealthCheckResponse['services']): 'healthy' | 'unhealthy' | 'degraded' {
  const statuses = Object.values(services).map(service => service.status)
  
  if (statuses.some(status => status === 'unhealthy')) {
    return 'unhealthy'
  }
  
  if (statuses.some(status => status === 'degraded')) {
    return 'degraded'
  }
  
  return 'healthy'
}

// Main health check endpoint
export async function healthCheck(request: NextRequest): Promise<NextResponse> {
  const context = createApiContext(request)
  const startTime = Date.now()
  
  try {
    // Check all services
    const [database, api, memory, disk] = await Promise.all([
      checkDatabaseHealth(),
      Promise.resolve(checkApiHealth()),
      Promise.resolve(checkMemoryHealth()),
      Promise.resolve(checkDiskHealth())
    ])
    
    const services = { database, api, memory, disk }
    const overallStatus = getOverallHealth(services)
    
    // Calculate metrics
    const uptime = Date.now() - APP_START_TIME
    const memoryUsage = process.memoryUsage()
    const totalMemory = memoryUsage.heapTotal + memoryUsage.external
    const usedMemory = memoryUsage.heapUsed
    const memoryPercentage = (usedMemory / totalMemory) * 100
    
    const averageResponseTime = metricsStore.requests.responseTimes.length > 0
      ? metricsStore.requests.responseTimes.reduce((a, b) => a + b, 0) / metricsStore.requests.responseTimes.length
      : 0
    
    const healthData: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      metrics: {
        requests: {
          total: metricsStore.requests.total,
          success: metricsStore.requests.success,
          error: metricsStore.requests.error,
          averageResponseTime
        },
        memory: {
          used: usedMemory,
          total: totalMemory,
          percentage: memoryPercentage
        }
      }
    }
    
    const response = createSuccessResponse(context, healthData)
    
    // Add health-specific headers
    response.headers.set('X-Health-Status', overallStatus)
    response.headers.set('X-Uptime', uptime.toString())
    response.headers.set('X-Memory-Usage', memoryPercentage.toFixed(2))
    
    return response
    
  } catch (error) {
    return createErrorResponse(
      context,
      'HEALTH_CHECK_FAILED',
      'Health check failed',
      500,
      error
    )
  } finally {
    // Record the health check request itself
    const responseTime = Date.now() - startTime
    recordRequestMetrics(true, responseTime)
  }
}

// Simple health check (for load balancers)
export async function simpleHealthCheck(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Quick database check
    await db.$queryRaw`SELECT 1`
    
    const responseTime = Date.now() - startTime
    recordRequestMetrics(true, responseTime)
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime
    }, {
      status: 200,
      headers: {
        'X-Response-Time': responseTime.toString()
      }
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    recordRequestMetrics(false, responseTime)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 503,
      headers: {
        'X-Response-Time': responseTime.toString()
      }
    })
  }
}

// Readiness check (for Kubernetes/Docker)
export async function readinessCheck(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if database is ready
    await db.$queryRaw`SELECT 1`
    
    // Check if critical services are ready
    // Add more checks as needed
    
    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Service not ready'
    }, { status: 503 })
  }
}

// Metrics endpoint
export async function getMetrics(request: NextRequest): Promise<NextResponse> {
  const context = createApiContext(request)
  
  try {
    const memoryUsage = process.memoryUsage()
    const uptime = Date.now() - APP_START_TIME
    
    // Get enhanced database metrics
    const [dbStats, poolStats] = await Promise.all([
      DatabaseMonitor.getDatabaseStats().catch(() => null),
      DatabaseMonitor.getConnectionPoolStats().catch(() => null)
    ])
    
    const metrics = {
      application: {
        uptime,
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform
      },
      requests: {
        total: metricsStore.requests.total,
        success: metricsStore.requests.success,
        error: metricsStore.requests.error,
        successRate: metricsStore.requests.total > 0 
          ? (metricsStore.requests.success / metricsStore.requests.total) * 100 
          : 0,
        errorRate: metricsStore.requests.total > 0 
          ? (metricsStore.requests.error / metricsStore.requests.total) * 100 
          : 0,
        averageResponseTime: metricsStore.requests.responseTimes.length > 0
          ? metricsStore.requests.responseTimes.reduce((a, b) => a + b, 0) / metricsStore.requests.responseTimes.length
          : 0
      },
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        heapUsagePercentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      database: {
        stats: dbStats,
        poolStats,
        status: dbStats ? 'connected' : 'disconnected'
      },
      timestamp: new Date().toISOString()
    }
    
    return createSuccessResponse(context, metrics)
  } catch (error) {
    return createErrorResponse(
      context,
      'METRICS_FAILED',
      'Failed to get metrics',
      500,
      error
    )
  }
}

// Database maintenance endpoint
export async function databaseMaintenance(request: NextRequest): Promise<NextResponse> {
  const context = createApiContext(request)
  
  try {
    const body = request.method === 'POST' ? await request.json() : {}
    const { action } = body

    if (!action || !['vacuum', 'analyze', 'optimize', 'stats'].includes(action)) {
      return createErrorResponse(
        context,
        'INVALID_ACTION',
        'Invalid action. Supported actions: vacuum, analyze, optimize, stats',
        400
      )
    }

    const startTime = Date.now()
    let result: any

    switch (action) {
      case 'vacuum':
        result = await DatabaseMonitor.analyzeQueryPerformance('vacuum', async () => {
          return db.$executeRaw`VACUUM`
        })
        break
      
      case 'analyze':
        result = await DatabaseMonitor.analyzeQueryPerformance('analyze', async () => {
          return db.$executeRaw`ANALYZE`
        })
        break
      
      case 'optimize':
        // For SQLite, optimization involves running both ANALYZE and VACUUM
        result = await DatabaseMonitor.analyzeQueryPerformance('optimize', async () => {
          await db.$executeRaw`ANALYZE`
          return db.$executeRaw`VACUUM`
        })
        break
      
      case 'stats':
        const [stats, pool] = await Promise.all([
          DatabaseMonitor.getDatabaseStats(),
          DatabaseMonitor.getConnectionPoolStats()
        ])
        
        return createSuccessResponse(context, {
          action: 'stats',
          timestamp: new Date().toISOString(),
          databaseStats: stats,
          poolStats: pool,
          queryTime: Date.now() - startTime
        })
    }

    return createSuccessResponse(context, {
      action,
      executionTime: result.executionTime,
      timestamp: new Date().toISOString(),
      message: `Database ${action} completed successfully`,
      result: result.result
    })

  } catch (error) {
    return createErrorResponse(
      context,
      'MAINTENANCE_ERROR',
      'Database maintenance failed',
      500,
      error
    )
  }
}