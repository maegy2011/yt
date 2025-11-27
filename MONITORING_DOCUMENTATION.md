# Documentation & Monitoring Infrastructure

This document provides comprehensive information about the YouTube Clone application's documentation and monitoring infrastructure.

## Table of Contents

1. [API Documentation](#api-documentation)
2. [Health Checks](#health-checks)
3. [Performance Monitoring](#performance-monitoring)
4. [Logging System](#logging-system)
5. [Monitoring Dashboard](#monitoring-dashboard)
6. [Configuration](#configuration)
7. [Best Practices](#best-practices)

## API Documentation

### OpenAPI/Swagger Documentation

The application provides comprehensive API documentation through the OpenAPI 3.0 specification.

#### Accessing Documentation

- **JSON Format**: `GET /api/docs`
- **YAML Format**: `GET /api/docs?format=yaml`

#### Features

- Complete API endpoint documentation
- Request/response schemas
- Authentication requirements
- Rate limiting information
- Error handling details
- Interactive testing capabilities

#### Example Usage

```bash
# Get API documentation in JSON format
curl http://localhost:3000/api/docs

# Get API documentation in YAML format
curl http://localhost:3000/api/docs?format=yaml
```

### API Coverage

The documentation covers all major API endpoints:

- **Health Checks**: `/api/health/*`
- **Favorites Management**: `/api/favorites/*`
- **Notebook System**: `/api/notebooks/*`
- **Watched History**: `/api/watched/*`
- **YouTube Integration**: `/api/youtube/*`
- **Channel Management**: `/api/channels/*`
- **Blacklist System**: `/api/blacklist/*`

## Health Checks

### Basic Health Check

**Endpoint**: `GET /api/health`

Provides a quick health status for load balancers and basic monitoring.

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "responseTime": 45
}
```

### Comprehensive Health Check

**Endpoint**: `GET /api/health/comprehensive`

Provides detailed health information including:

- Service status (database, YouTube API, filesystem)
- System metrics (memory, CPU, disk)
- Performance metrics
- Active alerts

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 86400000,
  "version": "2.0.0",
  "environment": "production",
  "services": {
    "database": {
      "name": "database",
      "status": "healthy",
      "responseTime": 12,
      "lastCheck": "2024-01-01T00:00:00.000Z",
      "details": {
        "queryTime": 8,
        "connections": 1,
        "recordCounts": {
          "favorites": 150,
          "watched": 89,
          "notebooks": 12
        }
      }
    }
  },
  "system": {
    "memory": {
      "used": 256,
      "total": 512,
      "percentage": 50.0,
      "status": "healthy"
    }
  },
  "metrics": {
    "requests": {
      "total": 1250,
      "success": 1220,
      "error": 30,
      "averageResponseTime": 145,
      "successRate": 97.6
    }
  },
  "alerts": []
}
```

### Database Health Check

**Endpoint**: `GET /api/health/database`

Detailed database health metrics including connection pool status and query performance.

## Performance Monitoring

### Monitoring Infrastructure

The application includes comprehensive performance monitoring through the `@/lib/monitoring` module.

#### Key Features

- **Request Timing**: Automatic monitoring of all API requests
- **Database Query Performance**: Track slow queries and optimization opportunities
- **Memory Usage**: Monitor memory consumption and leaks
- **Error Tracking**: Comprehensive error logging and alerting
- **Custom Metrics**: Add custom performance tracking

#### Using the Monitoring System

```typescript
import { monitoring, measureAsync, performanceMonitor } from '@/lib/monitoring';

// Manual performance logging
monitoring.logPerformance('custom-operation', 1500, { userId: '123' });

// Measure async operation
const result = await measureAsync('database-query', async () => {
  return await db.user.findMany();
});

// Use performance middleware
export const GET = withPerformanceMonitoring(async (request: Request) => {
  // Your handler code
  return NextResponse.json({ data: 'success' });
});
```

### Performance Metrics

The system tracks various metrics:

- **Response Times**: Average, min, max, percentiles
- **Success/Error Rates**: Request success percentages
- **Database Performance**: Query execution times
- **Memory Usage**: Heap consumption over time
- **Active Requests**: Currently processing requests

### Performance Decorators

```typescript
import { PerformanceMonitored } from '@/lib/performance-middleware';

class UserService {
  @PerformanceMonitored('user-lookup')
  async findById(id: string) {
    // Automatically monitored
    return await db.user.findUnique({ where: { id } });
  }
}
```

## Logging System

### Structured Logging

The application uses a comprehensive logging system (`@/lib/logging`) with multiple log levels and structured output.

#### Log Levels

- **DEBUG**: Detailed debugging information
- **INFO**: General information about application flow
- **WARN**: Warning messages for potentially problematic situations
- **ERROR**: Error messages for failures
- **FATAL**: Critical errors that may cause the application to stop

#### Using the Logger

```typescript
import { logger, apiLogger, createRequestContext } from '@/lib/logging';

// Basic logging
logger.info('User logged in', { userId: '123', ip: '192.168.1.1' });
logger.error('Database connection failed', error, { retryCount: 3 });

// Request logging
export async function GET(request: Request) {
  const context = createRequestContext(request);
  apiLogger.logRequest(context);
  
  try {
    // Your logic here
    apiLogger.logResponse({ ...context, statusCode: 200, duration: 150 });
    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('Request failed', error, context);
    throw error;
  }
}

// Specialized logging
apiLogger.logQuery('SELECT * FROM users', 25);
apiLogger.logUserAction('video-favorited', { videoId: 'abc123' });
apiLogger.logSecurity('login-attempt', 'medium', { ip: '192.168.1.1' });
```

### Log Context

All log entries support rich context information:

```typescript
interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  // ... any custom fields
}
```

### Log Sanitization

The logging system automatically sanitizes sensitive information:

- Passwords are replaced with `***`
- API tokens and secrets are masked
- Authorization headers are filtered

## Monitoring Dashboard

### Available Endpoints

#### Performance Metrics
- `GET /api/metrics` - Application performance metrics
- `GET /api/health/comprehensive` - System health overview

#### Log Access
- Logs are available through the monitoring system
- Recent logs can be accessed programmatically

#### Health Status
- Real-time health checks for all services
- Alert generation for degraded performance

### Integration with External Systems

The monitoring infrastructure is designed to integrate with:

- **APM Tools**: New Relic, DataDog, AppDynamics
- **Log Aggregation**: ELK Stack, Splunk, Fluentd
- **Monitoring Services**: Prometheus, Grafana
- **Alerting**: PagerDuty, Slack, Email notifications

## Configuration

### Environment Variables

```bash
# Monitoring Configuration
MONITORING_ENABLED=true
MONITORING_SAMPLE_RATE=1.0
MONITORING_SLOW_REQUEST_THRESHOLD=5000
MONITORING_SLOW_QUERY_THRESHOLD=2000

# Logging Configuration
LOG_LEVEL=info
LOG_SERVICE=youtube-clone
LOG_STRUCTURED_OUTPUT=true
LOG_INCLUDE_STACK_TRACE=true

# Health Check Configuration
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
```

### Runtime Configuration

```typescript
import { logger, performanceMonitor } from '@/lib/monitoring';

// Update logging configuration
logger.updateConfig({
  level: LogLevel.DEBUG,
  enableConsole: true,
  structuredOutput: true
});

// Update performance monitoring
performanceMonitor.updateConfig({
  sampleRate: 0.5, // Monitor 50% of requests
  slowRequestThreshold: 3000,
  enableMemoryTracking: true
});
```

## Best Practices

### Performance Monitoring

1. **Use Middleware**: Apply performance monitoring to all API routes
2. **Monitor Database Queries**: Track slow queries and optimize them
3. **Set Appropriate Thresholds**: Configure thresholds based on your requirements
4. **Sample in Production**: Use sampling to reduce overhead in high-traffic scenarios

```typescript
// Recommended setup for production
const productionMonitor = new PerformanceMonitor({
  sampleRate: 0.1, // Monitor 10% of requests
  slowRequestThreshold: 3000,
  enableDetailedLogging: false
});
```

### Logging Best Practices

1. **Use Structured Logging**: Always include relevant context
2. **Choose Appropriate Levels**: Use the correct log level for each message
3. **Avoid Sensitive Data**: Let the system handle sanitization
4. **Include Request IDs**: Trace requests through the system

```typescript
// Good logging example
logger.info('User action completed', {
  requestId: context.requestId,
  userId: context.userId,
  action: 'video-favorited',
  videoId: 'abc123',
  duration: 150
});
```

### Health Check Implementation

1. **Check External Dependencies**: Verify database, APIs, and services
2. **Provide Context**: Include response times and error details
3. **Use Appropriate HTTP Status**: Return 503 for unhealthy services
4. **Monitor Resource Usage**: Track memory, CPU, and disk usage

### Error Handling

1. **Log Errors with Context**: Include request details and stack traces
2. **Categorize Errors**: Use different log levels for different error types
3. **Monitor Error Rates**: Track error percentages and set alerts
4. **Provide Recovery Information**: Include retry suggestions where applicable

## Troubleshooting

### Common Issues

#### High Memory Usage
- Check for memory leaks in long-running processes
- Monitor garbage collection patterns
- Review database connection pooling

#### Slow Database Queries
- Use the database health check to identify slow queries
- Review query performance metrics
- Consider adding database indexes

#### Missing Logs
- Verify log level configuration
- Check log output destinations
- Ensure proper log formatting

### Debug Information

Enable debug mode for detailed troubleshooting:

```typescript
logger.updateConfig({ level: LogLevel.DEBUG });
performanceMonitor.updateConfig({ 
  enableDetailedLogging: true,
  sampleRate: 1.0 
});
```

## API Examples

### Monitoring API Usage

```typescript
// Monitor a specific operation
const result = await measureAsync('user-registration', async () => {
  const user = await createUser(userData);
  await sendWelcomeEmail(user.email);
  return user;
});

// Log custom metrics
monitoring.logPerformance('email-sent', 250, {
  type: 'welcome',
  provider: 'sendgrid'
});

// Check system health
const health = await fetch('/api/health/comprehensive').then(r => r.json());
if (health.status !== 'healthy') {
  logger.warn('System health degraded', { health });
}
```

### Integration with External Tools

```typescript
// Prometheus metrics export
export async function GET() {
  const metrics = monitoring.getPerformanceSummary();
  
  const prometheusFormat = `
# HELP api_request_duration_seconds API request duration
# TYPE api_request_duration_seconds histogram
api_request_duration_seconds_sum ${metrics.totalDuration}
api_request_duration_seconds_count ${metrics.totalRequests}

# HELP api_errors_total Total API errors
# TYPE api_errors_total counter
api_errors_total ${metrics.errorCount}
  `.trim();

  return new NextResponse(prometheusFormat, {
    headers: { 'Content-Type': 'text/plain' }
  });
}
```

This comprehensive documentation and monitoring infrastructure provides enterprise-grade observability for the YouTube Clone application, enabling effective troubleshooting, performance optimization, and system maintenance.