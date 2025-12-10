/**
 * Monitoring and Performance Logging Infrastructure
 * Provides comprehensive monitoring capabilities for the YouTube Clone application
 */

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
  success: boolean;
  error?: string;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  responseTime?: number;
  details?: Record<string, any>;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

class MonitoringService {
  private metrics: PerformanceMetric[] = [];
  private healthChecks: HealthCheck[] = [];
  private logs: LogEntry[] = [];
  private maxMetrics = 1000;
  private maxLogs = 5000;

  /**
   * Log performance metrics for an operation
   */
  logPerformance(operation: string, duration: number, metadata?: Record<string, any>, error?: string): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date(),
      metadata,
      success: !error,
      error
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log to console with structured format
    const logLevel = this.getPerformanceLogLevel(duration);
    console[logLevel](`[PERF] ${operation}: ${duration}ms`, {
      metadata,
      success: !error,
      error,
      timestamp: metric.timestamp.toISOString()
    });

    // Alert on slow operations
    if (duration > 5000) {
      this.warn(`Slow operation detected: ${operation} took ${duration}ms`, { operation, duration });
    }
  }

  /**
   * Measure and log the execution time of an async function
   */
  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    let result: T;
    let error: string | undefined;

    try {
      result = await fn();
      return result;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      this.logPerformance(operation, duration, metadata, error);
    }
  }

  /**
   * Measure and log the execution time of a sync function
   */
  measure<T>(operation: string, fn: () => T, metadata?: Record<string, any>): T {
    const startTime = Date.now();
    let result: T;
    let error: string | undefined;

    try {
      result = fn();
      return result;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      this.logPerformance(operation, duration, metadata, error);
    }
  }

  /**
   * Log a health check for a service
   */
  logHealthCheck(service: string, status: HealthCheck['status'], responseTime?: number, details?: Record<string, any>): void {
    const healthCheck: HealthCheck = {
      service,
      status,
      timestamp: new Date(),
      responseTime,
      details
    };

    this.healthChecks.push(healthCheck);
    
    // Keep only recent health checks
    if (this.healthChecks.length > 100) {
      this.healthChecks = this.healthChecks.slice(-100);
    }

    const logLevel = status === 'healthy' ? 'info' : status === 'degraded' ? 'warn' : 'error';
    console[logLevel](`[HEALTH] ${service}: ${status}`, {
      responseTime,
      details,
      timestamp: healthCheck.timestamp.toISOString()
    });
  }

  /**
   * Log a structured message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  private log(level: LogEntry['level'], message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context
    };

    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console
    console[level](`[${level.toUpperCase()}] ${message}`, {
      context,
      timestamp: entry.timestamp.toISOString()
    });
  }

  /**
   * Get performance metrics summary
   */
  getPerformanceSummary(operation?: string) {
    const filteredMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (filteredMetrics.length === 0) {
      return null;
    }

    const durations = filteredMetrics.map(m => m.duration);
    const successRate = (filteredMetrics.filter(m => m.success).length / filteredMetrics.length) * 100;

    return {
      operation: operation || 'all',
      count: filteredMetrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p95Duration: this.calculatePercentile(durations, 95),
      p99Duration: this.calculatePercentile(durations, 99),
      successRate,
      errorRate: 100 - successRate,
      timeRange: {
        start: new Date(Math.min(...filteredMetrics.map(m => m.timestamp.getTime()))),
        end: new Date(Math.max(...filteredMetrics.map(m => m.timestamp.getTime())))
      }
    };
  }

  /**
   * Get recent performance metrics
   */
  getRecentMetrics(limit = 100, operation?: string) {
    let metrics = [...this.metrics].reverse();
    
    if (operation) {
      metrics = metrics.filter(m => m.operation === operation);
    }
    
    return metrics.slice(0, limit);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit = 100, level?: LogEntry['level']) {
    let logs = [...this.logs].reverse();
    
    if (level) {
      logs = logs.filter(l => l.level === level);
    }
    
    return logs.slice(0, limit);
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    const recentChecks = this.healthChecks.slice(-20);
    const services = new Set(recentChecks.map(check => check.service));
    
    return Array.from(services).map(service => {
      const serviceChecks = recentChecks.filter(check => check.service === service);
      const latestCheck = serviceChecks[serviceChecks.length - 1];
      
      return {
        service,
        status: latestCheck?.status || 'unknown',
        lastCheck: latestCheck?.timestamp,
        responseTime: latestCheck?.responseTime,
        details: latestCheck?.details,
        checkCount: serviceChecks.length
      };
    });
  }

  /**
   * Clear all monitoring data
   */
  clearData(): void {
    this.metrics = [];
    this.healthChecks = [];
    this.logs = [];
    this.info('Monitoring data cleared');
  }

  private getPerformanceLogLevel(duration: number): 'log' | 'warn' | 'error' {
    if (duration > 10000) return 'error';
    if (duration > 5000) return 'warn';
    return 'log';
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

/**
 * Performance monitoring decorator for functions
 */
export function performanceMonitor(operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return await monitoring.measureAsync(
        operationName,
        () => method.apply(this, args),
        { args: args.length }
      );
    };

    return descriptor;
  };
}

/**
 * API response time monitoring middleware
 */
export function createApiMonitor(operation: string) {
  return async (handler: () => Promise<any>) => {
    return await monitoring.measureAsync(
      `api:${operation}`,
      () => handler(),
      { type: 'api_call' }
    );
  };
}

/**
 * Database query monitoring
 */
export function monitorDbQuery(query: string, params?: any[]) {
  return monitoring.measureAsync(
    `db:${query.split(' ')[0].toLowerCase()}`,
    async () => {
      // This would be called within the actual database operation
      return { query, params };
    },
    { query: query.substring(0, 100), paramCount: params?.length }
  );
}

/**
 * Component render performance monitoring
 */
export function monitorComponentRender(componentName: string) {
  const startTime = Date.now();
  
  return {
    finish: () => {
      const duration = Date.now() - startTime;
      monitoring.logPerformance(`component:${componentName}`, duration, { type: 'render' });
    }
  };
}

/**
 * Memory usage monitoring
 */
export function logMemoryUsage(context?: string) {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    monitoring.debug('Memory usage', {
      context,
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100,
    });
  }
}

// Export convenience functions
export const logPerformance = (operation: string, duration: number, metadata?: Record<string, any>) => 
  monitoring.logPerformance(operation, duration, metadata);

export const measureAsync = <T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>) => 
  monitoring.measureAsync(operation, fn, metadata);

export const measure = <T>(operation: string, fn: () => T, metadata?: Record<string, any>) => 
  monitoring.measure(operation, fn, metadata);

export const logHealthCheck = (service: string, status: HealthCheck['status'], responseTime?: number, details?: Record<string, any>) => 
  monitoring.logHealthCheck(service, status, responseTime, details);

export const { debug, info, warn, error } = monitoring;