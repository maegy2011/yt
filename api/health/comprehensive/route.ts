/**
 * Enhanced Health Check Endpoint
 * Integrates with the monitoring system for comprehensive health monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoring, logHealthCheck } from '@/lib/monitoring';
import { db } from '@/lib/db';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
  lastCheck: string;
}

interface ComprehensiveHealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: Record<string, ServiceHealth>;
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
      status: 'healthy' | 'unhealthy' | 'degraded';
    };
    cpu: {
      usage: number;
      status: 'healthy' | 'unhealthy' | 'degraded';
    };
    disk: {
      usage: number;
      status: 'healthy' | 'unhealthy' | 'degraded';
    };
  };
  metrics: {
    requests: {
      total: number;
      success: number;
      error: number;
      averageResponseTime: number;
      successRate: number;
    };
    performance: {
      slowQueries: number;
      fastQueries: number;
      averageQueryTime: number;
    };
  };
  alerts: Array<{
    level: 'info' | 'warning' | 'critical';
    message: string;
    service: string;
    timestamp: string;
  }>;
}

const APP_START_TIME = Date.now();

// Check database health with comprehensive metrics
async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Test basic connectivity
    await db.$queryRaw`SELECT 1`;
    
    // Test query performance
    const queryStart = Date.now();
    const result = await db.$queryRaw`SELECT COUNT(*) as count FROM sqlite_master`;
    const queryTime = Date.now() - queryStart;
    
    // Get database statistics
    const dbStats = await getDatabaseStats();
    
    const responseTime = Date.now() - startTime;
    
    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let alerts: string[] = [];
    
    if (queryTime > 5000) {
      status = 'unhealthy';
      alerts.push(`Slow query performance: ${queryTime}ms`);
    } else if (queryTime > 2000) {
      status = 'degraded';
      alerts.push(`Degraded query performance: ${queryTime}ms`);
    }
    
    if (dbStats.connections > 50) {
      status = status === 'healthy' ? 'degraded' : status;
      alerts.push(`High connection count: ${dbStats.connections}`);
    }
    
    const health: ServiceHealth = {
      name: 'database',
      status,
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        queryTime,
        ...dbStats,
        alerts
      }
    };
    
    // Log to monitoring system
    logHealthCheck('database', status, responseTime, health.details);
    
    return health;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    
    const health: ServiceHealth = {
      name: 'database',
      status: 'unhealthy',
      responseTime,
      error: errorMessage,
      lastCheck: new Date().toISOString()
    };
    
    logHealthCheck('database', 'unhealthy', responseTime, { error: errorMessage });
    
    return health;
  }
}

// Check YouTube API health
async function checkYouTubeApiHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Make a simple request to check YouTube API availability
    const response = await fetch('https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=json', {
      method: 'GET',
      headers: {
        'User-Agent': 'YouTube-Clone-Health-Check/1.0'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (!response.ok) {
      if (response.status >= 500) {
        status = 'unhealthy';
      } else {
        status = 'degraded';
      }
    }
    
    const health: ServiceHealth = {
      name: 'youtube-api',
      status,
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        statusCode: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      }
    };
    
    logHealthCheck('youtube-api', status, responseTime, health.details);
    
    return health;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
    
    const health: ServiceHealth = {
      name: 'youtube-api',
      status: 'unhealthy',
      responseTime,
      error: errorMessage,
      lastCheck: new Date().toISOString()
    };
    
    logHealthCheck('youtube-api', 'unhealthy', responseTime, { error: errorMessage });
    
    return health;
  }
}

// Check file system health
async function checkFileSystemHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Check if we can write to the file system
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');
    
    const testFile = path.default.join(os.default.tmpdir(), 'health-check-test');
    fs.default.writeFileSync(testFile, 'health check');
    fs.default.unlinkSync(testFile);
    
    const responseTime = Date.now() - startTime;
    
    const health: ServiceHealth = {
      name: 'filesystem',
      status: 'healthy',
      responseTime,
      lastCheck: new Date().toISOString(),
      details: {
        writable: true,
        tempDir: os.tmpdir()
      }
    };
    
    logHealthCheck('filesystem', 'healthy', responseTime, health.details);
    
    return health;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Filesystem error';
    
    const health: ServiceHealth = {
      name: 'filesystem',
      status: 'unhealthy',
      responseTime,
      error: errorMessage,
      lastCheck: new Date().toISOString()
    };
    
    logHealthCheck('filesystem', 'unhealthy', responseTime, { error: errorMessage });
    
    return health;
  }
}

// Get database statistics
async function getDatabaseStats(): Promise<Record<string, any>> {
  try {
    const stats = await db.$queryRaw`
      SELECT 
        (SELECT COUNT(*) FROM sqlite_master WHERE type='table') as tableCount,
        (SELECT COUNT(*) FROM FavoriteVideo) as favoriteCount,
        (SELECT COUNT(*) FROM WatchedVideo) as watchedCount,
        (SELECT COUNT(*) FROM Notebook) as notebookCount
    `;
    
    return {
      connections: 1, // SQLite doesn't have connection pooling in the same way
      tableCount: (stats as any)[0]?.tableCount || 0,
      recordCounts: {
        favorites: (stats as any)[0]?.favoriteCount || 0,
        watched: (stats as any)[0]?.watchedCount || 0,
        notebooks: (stats as any)[0]?.notebookCount || 0
      }
    };
  } catch (error) {
    return {
      connections: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get system metrics
function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const usedMemory = memoryUsage.heapUsed;
  const totalMemory = memoryUsage.heapTotal;
  const memoryPercentage = (usedMemory / totalMemory) * 100;
  
  // Determine memory health
  let memoryStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (memoryPercentage > 90) {
    memoryStatus = 'unhealthy';
  } else if (memoryPercentage > 75) {
    memoryStatus = 'degraded';
  }
  
  return {
    memory: {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: Math.round(memoryPercentage * 100) / 100,
      status: memoryStatus
    },
    cpu: {
      usage: 0, // Would need additional library for actual CPU usage
      status: 'healthy' as const
    },
    disk: {
      usage: 0, // Would need additional library for actual disk usage
      status: 'healthy' as const
    }
  };
}

// Get performance metrics from monitoring system
function getPerformanceMetrics() {
  const perfSummary = monitoring.getPerformanceSummary();
  const recentMetrics = monitoring.getRecentMetrics(100);
  
  if (!perfSummary) {
    return {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        averageResponseTime: 0,
        successRate: 100
      },
      performance: {
        slowQueries: 0,
        fastQueries: 0,
        averageQueryTime: 0
      }
    };
  }
  
  // Count slow vs fast queries
  const dbMetrics = recentMetrics.filter(m => m.operation.startsWith('db:'));
  const slowQueries = dbMetrics.filter(m => m.duration > 2000).length;
  const fastQueries = dbMetrics.filter(m => m.duration <= 2000).length;
  
  return {
    requests: {
      total: perfSummary.count,
      success: Math.round((perfSummary.successRate / 100) * perfSummary.count),
      error: Math.round((perfSummary.errorRate / 100) * perfSummary.count),
      averageResponseTime: Math.round(perfSummary.avgDuration),
      successRate: Math.round(perfSummary.successRate * 100) / 100
    },
    performance: {
      slowQueries,
      fastQueries,
      averageQueryTime: dbMetrics.length > 0 
        ? Math.round(dbMetrics.reduce((sum, m) => sum + m.duration, 0) / dbMetrics.length)
        : 0
    }
  };
}

// Generate alerts based on health checks
function generateAlerts(services: Record<string, ServiceHealth>, system: any) {
  const alerts: any[] = [];
  
  // Service alerts
  Object.values(services).forEach(service => {
    if (service.status === 'unhealthy') {
      alerts.push({
        level: 'critical',
        message: `${service.name} is unhealthy: ${service.error || 'No response'}`,
        service: service.name,
        timestamp: service.lastCheck
      });
    } else if (service.status === 'degraded') {
      alerts.push({
        level: 'warning',
        message: `${service.name} performance is degraded`,
        service: service.name,
        timestamp: service.lastCheck
      });
    }
  });
  
  // System alerts
  if (system.memory.status === 'unhealthy') {
    alerts.push({
      level: 'critical',
      message: `High memory usage: ${system.memory.percentage}%`,
      service: 'system',
      timestamp: new Date().toISOString()
    });
  } else if (system.memory.status === 'degraded') {
    alerts.push({
      level: 'warning',
      message: `Elevated memory usage: ${system.memory.percentage}%`,
      service: 'system',
      timestamp: new Date().toISOString()
    });
  }
  
  return alerts;
}

// Main health check endpoint
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    monitoring.info('Comprehensive health check initiated');
    
    // Check all services
    const [database, youtubeApi, filesystem] = await Promise.all([
      checkDatabaseHealth(),
      checkYouTubeApiHealth(),
      checkFileSystemHealth()
    ]);
    
    const services = {
      database,
      'youtube-api': youtubeApi,
      filesystem
    };
    
    const system = getSystemMetrics();
    const metrics = getPerformanceMetrics();
    const alerts = generateAlerts(services, system);
    
    // Determine overall health
    const serviceStatuses = Object.values(services).map(s => s.status);
    const systemStatuses = [system.memory.status, system.cpu.status, system.disk.status];
    const allStatuses = [...serviceStatuses, ...systemStatuses];
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (allStatuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (allStatuses.includes('degraded')) {
      overallStatus = 'degraded';
    }
    
    const response: ComprehensiveHealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - APP_START_TIME,
      version: process.env.npm_package_version || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      system,
      metrics,
      alerts
    };
    
    const responseTime = Date.now() - startTime;
    monitoring.logPerformance('health:comprehensive', responseTime, {
      status: overallStatus,
      serviceCount: Object.keys(services).length,
      alertCount: alerts.length
    });
    
    // Return appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        'X-Health-Status': overallStatus,
        'X-Response-Time': responseTime.toString(),
        'X-Alert-Count': alerts.length.toString(),
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    monitoring.error('Health check failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      responseTime
    });
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      services: {},
      system: {},
      metrics: {},
      alerts: [{
        level: 'critical',
        message: `Health check failed: ${errorMessage}`,
        service: 'health-check',
        timestamp: new Date().toISOString()
      }]
    }, {
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
        'X-Response-Time': responseTime.toString(),
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}