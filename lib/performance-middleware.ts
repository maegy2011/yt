/**
 * Performance Monitoring Middleware
 * Provides comprehensive performance monitoring for API routes and application components
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoring, measureAsync } from '@/lib/monitoring';
import { logger, createRequestContext, logAsyncOperation } from '@/lib/logging';

export interface PerformanceConfig {
  enableDetailedLogging: boolean;
  slowQueryThreshold: number;
  slowRequestThreshold: number;
  enableMemoryTracking: boolean;
  enableDatabaseMonitoring: boolean;
  enableCpuMonitoring: boolean;
  sampleRate: number; // 0.0 to 1.0, percentage of requests to monitor in detail
}

export interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryBefore?: number;
  memoryAfter?: number;
  memoryDelta?: number;
  cpuUsage?: number;
  databaseQueries?: Array<{
    query: string;
    duration: number;
    timestamp: number;
  }>;
  cacheHits?: number;
  cacheMisses?: number;
  errors: Array<{
    error: string;
    timestamp: number;
    stack?: string;
  }>;
  metadata: Record<string, any>;
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private activeRequests = new Map<string, PerformanceMetrics>();
  private requestCounter = 0;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableDetailedLogging: true,
      slowQueryThreshold: 2000, // 2 seconds
      slowRequestThreshold: 5000, // 5 seconds
      enableMemoryTracking: true,
      enableDatabaseMonitoring: true,
      enableCpuMonitoring: false, // Requires additional dependencies
      sampleRate: 1.0, // Monitor all requests by default
      ...config
    };
  }

  /**
   * Middleware function for Next.js API routes
   */
  middleware(handler: (request: NextRequest, ...args: any[]) => Promise<any>) {
    return async (request: NextRequest, ...args: any[]) => {
      const requestId = this.generateRequestId();
      const startTime = Date.now();
      const url = new URL(request.url);
      
      // Decide whether to monitor this request in detail
      const shouldMonitor = Math.random() < this.config.sampleRate;
      
      const metrics: PerformanceMetrics = {
        requestId,
        method: request.method,
        url: url.pathname + url.search,
        startTime,
        metadata: {
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          contentType: request.headers.get('content-type'),
          shouldMonitor
        }
      };

      // Track memory before request
      if (this.config.enableMemoryTracking) {
        metrics.memoryBefore = process.memoryUsage().heapUsed;
      }

      // Store metrics for this request
      if (shouldMonitor) {
        this.activeRequests.set(requestId, metrics);
      }

      try {
        // Log request start
        logger.debug(`Request started: ${request.method} ${url.pathname}`, {
          requestId,
          method: request.method,
          url: url.pathname + url.search
        });

        // Execute the handler with performance monitoring
        const result = await measureAsync(
          `api:${request.method}:${url.pathname}`,
          () => handler(request, ...args),
          {
            requestId,
            method: request.method,
            url: url.pathname + url.search
          }
        );

        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;

        // Track memory after request
        if (this.config.enableMemoryTracking) {
          metrics.memoryAfter = process.memoryUsage().heapUsed;
          metrics.memoryDelta = (metrics.memoryAfter || 0) - (metrics.memoryBefore || 0);
        }

        // Log successful request
        logger.info(`Request completed: ${request.method} ${url.pathname}`, {
          requestId,
          method: request.method,
          url: url.pathname + url.search,
          duration: metrics.duration,
          memoryDelta: metrics.memoryDelta
        });

        // Log slow requests
        if (metrics.duration > this.config.slowRequestThreshold) {
          logger.warn(`Slow request detected`, {
            requestId,
            method: request.method,
            url: url.pathname + url.search,
            duration: metrics.duration,
            threshold: this.config.slowRequestThreshold
          });
        }

        // Record performance metrics
        monitoring.logPerformance(
          `request:${request.method}:${url.pathname}`,
          metrics.duration,
          {
            requestId,
            method: request.method,
            url: url.pathname + url.search,
            memoryDelta: metrics.memoryDelta,
            statusCode: result?.status
          }
        );

        return result;

      } catch (error) {
        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;

        // Record error
        const errorMessage = error instanceof Error ? error.message : String(error);
        metrics.errors.push({
          error: errorMessage,
          timestamp: Date.now(),
          stack: error instanceof Error ? error.stack : undefined
        });

        // Log failed request
        logger.error(`Request failed: ${request.method} ${url.pathname}`, error instanceof Error ? error : new Error(errorMessage), {
          requestId,
          method: request.method,
          url: url.pathname + url.search,
          duration: metrics.duration
        });

        // Record error metrics
        monitoring.logPerformance(
          `request:${request.method}:${url.pathname}`,
          metrics.duration,
          {
            requestId,
            method: request.method,
            url: url.pathname + url.search,
            error: errorMessage,
            success: false
          },
          errorMessage
        );

        throw error;

      } finally {
        // Clean up
        if (shouldMonitor) {
          this.activeRequests.delete(requestId);
        }
      }
    };
  }

  /**
   * Monitor database query performance
   */
  monitorQuery<T>(query: string, fn: () => Promise<T>): Promise<T> {
    if (!this.config.enableDatabaseMonitoring) {
      return fn();
    }

    return logAsyncOperation(
      `db:${query.split(' ')[0].toLowerCase()}`,
      async () => {
        const startTime = Date.now();
        
        try {
          const result = await fn();
          const duration = Date.now() - startTime;

          // Log slow queries
          if (duration > this.config.slowQueryThreshold) {
            logger.warn(`Slow database query detected`, {
              query: query.substring(0, 200),
              duration,
              threshold: this.config.slowQueryThreshold
            });
          }

          // Update active requests with query info
          this.activeRequests.forEach(metrics => {
            if (!metrics.databaseQueries) {
              metrics.databaseQueries = [];
            }
            metrics.databaseQueries.push({
              query: query.substring(0, 200),
              duration,
              timestamp: startTime
            });
          });

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          logger.error(`Database query failed`, error instanceof Error ? error : new Error(String(error)), {
            query: query.substring(0, 200),
            duration
          });

          throw error;
        }
      },
      { query: query.substring(0, 100) }
    );
  }

  /**
   * Monitor component render performance
   */
  monitorComponentRender(componentName: string, renderFn: () => any): any {
    if (!this.config.enableDetailedLogging) {
      return renderFn();
    }

    const startTime = Date.now();
    const memoryBefore = this.config.enableMemoryTracking ? process.memoryUsage().heapUsed : undefined;

    try {
      const result = renderFn();
      const duration = Date.now() - startTime;
      const memoryAfter = this.config.enableMemoryTracking ? process.memoryUsage().heapUsed : undefined;

      monitoring.logPerformance(`component:${componentName}`, duration, {
        type: 'render',
        memoryDelta: memoryAfter && memoryBefore ? memoryAfter - memoryBefore : undefined
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Component render failed: ${componentName}`, error instanceof Error ? error : new Error(String(error)), {
        duration,
        type: 'render'
      });

      throw error;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const recentMetrics = monitoring.getRecentMetrics(100);
    const healthStatus = monitoring.getHealthStatus();
    
    return {
      activeRequests: this.activeRequests.size,
      recentMetrics: recentMetrics.length,
      healthChecks: healthStatus.length,
      averageResponseTime: recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length 
        : 0,
      slowRequests: recentMetrics.filter(m => m.duration > this.config.slowRequestThreshold).length,
      errorRate: recentMetrics.length > 0 
        ? (recentMetrics.filter(m => !m.success).length / recentMetrics.length) * 100 
        : 0
    };
  }

  /**
   * Get active requests
   */
  getActiveRequests(): PerformanceMetrics[] {
    return Array.from(this.activeRequests.values());
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.activeRequests.clear();
    this.requestCounter = 0;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience middleware function
export function withPerformanceMonitoring(handler: (request: NextRequest, ...args: any[]) => Promise<any>) {
  return performanceMonitor.middleware(handler);
}

// Database query monitoring helper
export function monitorDbQuery<T>(query: string, fn: () => Promise<T>): Promise<T> {
  return performanceMonitor.monitorQuery(query, fn);
}

// Component monitoring helper
export function monitorComponent<T>(componentName: string, renderFn: () => T): T {
  return performanceMonitor.monitorComponentRender(componentName, renderFn);
}

// React Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const startTime = Date.now();
  
  return {
    markRender: () => {
      const duration = Date.now() - startTime;
      monitoring.logPerformance(`component:${componentName}`, duration, { type: 'render' });
    },
    markOperation: (operation: string) => {
      const duration = Date.now() - startTime;
      monitoring.logPerformance(`component:${componentName}:${operation}`, duration, { 
        type: 'operation',
        operation 
      });
    }
  };
}

// Performance monitoring decorator for classes
export function PerformanceMonitored(operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return await measureAsync(
        operationName,
        () => method.apply(this, args),
        { 
          args: args.length,
          className: target.constructor.name,
          methodName: propertyName
        }
      );
    };

    return descriptor;
  };
}

export default performanceMonitor;