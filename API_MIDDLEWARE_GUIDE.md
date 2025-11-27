# API Middleware Documentation

This document describes the comprehensive API middleware system implemented for the YouTube clone application.

## 🚀 Features Implemented

### 1. **Rate Limiting**
- **In-memory rate limiting** (configurable for production use with Redis)
- **Per-IP rate limits** with configurable windows
- **Standard and legacy headers** support
- **Automatic cleanup** of expired entries

### 2. **Request Validation**
- **Zod-based validation** schemas
- **Body, query, and header validation**
- **Type-safe validation** with detailed error messages
- **Common validation patterns** for YouTube API

### 3. **CORS & Security Headers**
- **Configurable CORS policies**
- **Security headers** (XSS, CSRF protection, etc.)
- **Content-Type validation**
- **Custom security rules**

### 4. **API Versioning**
- **Multiple version support** (v1, v2)
- **Version extraction** from URL, query, or headers
- **Deprecation warnings** and sunset support
- **Migration guide** support

### 5. **Health Monitoring**
- **Database health checks**
- **Memory usage monitoring**
- **API performance metrics**
- **Readiness probes** for container orchestration

### 6. **Logging & Metrics**
- **Request/response logging**
- **Performance metrics** collection
- **Error tracking**
- **Configurable log levels**

## 📁 File Structure

```
lib/api/
├── types.ts          # Type definitions
├── middleware.ts       # Core middleware functions
├── validation.ts      # Request validation
├── versioning.ts      # API versioning
├── wrapper.ts         # Middleware wrapper
└── health.ts          # Health checks
```

## 🔧 Usage Examples

### Basic Middleware Usage

```typescript
import { routeMiddleware } from '@/lib/api/wrapper'

// Public endpoint (rate limiting only)
export const GET = routeMiddleware.public(async (request, context) => {
  // Your logic here
  return NextResponse.json({ data: 'success' })
})

// Authenticated endpoint (rate limiting + validation)
export const POST = routeMiddleware.authenticated(async (request, context) => {
  // Your logic here
  return NextResponse.json({ data: 'success' })
})

// Admin endpoint (strict rate limiting)
export const DELETE = routeMiddleware.admin(async (request, context) => {
  // Your logic here
  return NextResponse.json({ data: 'success' })
})
```

### Custom Middleware Configuration

```typescript
import { withMiddleware } from '@/lib/api/wrapper'

export const GET = withMiddleware(async (request, context) => {
  // Your logic here
  return NextResponse.json({ data: 'success' })
}, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 30 // 30 requests per minute
  },
  cors: {
    origin: ['https://yourdomain.com'],
    credentials: true
  },
  validation: {
    body: true,
    query: true
  }
})
```

### Request Validation

```typescript
import { withValidation, validationMiddleware } from '@/lib/api/wrapper'

export const POST = withValidation(
  validationMiddleware.validateFavoriteVideo,
  async (request, context, validatedData) => {
    // validatedData contains validated and typed data
    const { videoId, title, channelName } = validatedData
    
    // Your logic here
    return NextResponse.json({ success: true })
  }
)
```

### API Versioning

```typescript
import { withVersioning } from '@/lib/api/versioning'

export const GET = withVersioning(async (request, context, version) => {
  if (version === 'v1') {
    // V1 implementation
    return NextResponse.json({ version: 'v1', data: [] })
  } else if (version === 'v2') {
    // V2 implementation
    return NextResponse.json({ version: 'v2', data: [], features: ['new'] })
  }
})
```

## 📊 Response Format

All API responses follow a consistent format:

```typescript
{
  "success": boolean,
  "data"?: T,
  "error"?: {
    "code": string,
    "message": string,
    "details"?: any,
    "timestamp": string,
    "requestId": string,
    "path": string,
    "method": string
  },
  "meta": {
    "requestId": string,
    "timestamp": string,
    "version": string,
    "pagination"?: {
      "page": number,
      "limit": number,
      "total": number,
      "hasMore": boolean
    }
  }
}
```

## 🔒 Security Features

### Rate Limiting Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: Wed, 21 Oct 2025 15:30:00 GMT
Retry-After: 30
```

### CORS Headers
```http
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

### Security Headers
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## 🏥 Health Endpoints

### Simple Health Check
```
GET /api/health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "responseTime": 15
}
```

### Detailed Health Check
```
POST /api/health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600000,
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 5,
      "lastCheck": "2025-01-15T10:30:00.000Z"
    },
    "api": {
      "status": "healthy",
      "responseTime": 12,
      "lastCheck": "2025-01-15T10:30:00.000Z"
    },
    "memory": {
      "status": "healthy",
      "lastCheck": "2025-01-15T10:30:00.000Z"
    },
    "disk": {
      "status": "healthy",
      "lastCheck": "2025-01-15T10:30:00.000Z"
    }
  },
  "metrics": {
    "requests": {
      "total": 1000,
      "success": 950,
      "error": 50,
      "averageResponseTime": 150
    },
    "memory": {
      "used": 134217728,
      "total": 268435456,
      "percentage": 50.0
    }
  }
}
```

### Readiness Check
```
PUT /api/health
```
Response:
```json
{
  "status": "ready",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## 📈 Metrics Endpoint

```
PATCH /api/health
```
Response:
```json
{
  "success": true,
  "data": {
    "application": {
      "uptime": 3600000,
      "version": "1.0.0",
      "environment": "production",
      "nodeVersion": "v18.17.0",
      "platform": "linux"
    },
    "requests": {
      "total": 1000,
      "success": 950,
      "error": 50,
      "successRate": 95.0,
      "errorRate": 5.0,
      "averageResponseTime": 150
    },
    "memory": {
      "rss": 134217728,
      "heapTotal": 268435456,
      "heapUsed": 134217728,
      "external": 0,
      "heapUsagePercentage": 50.0
    },
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

## 🔧 Configuration

### Environment Variables
```bash
# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
CORS_CREDENTIALS=true

# API versioning
DEFAULT_API_VERSION=v1

# Logging
LOG_LEVEL=info
```

### Custom Configuration
```typescript
// lib/api/config.ts
export const API_CONFIG = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },
  logging: {
    enabled: process.env.NODE_ENV === 'production',
    level: process.env.LOG_LEVEL as any || 'info'
  }
}
```

## 🚨 Error Codes

| Code | Description |
|------|-------------|
| `RATE_LIMIT_EXCEEDED` | Too many requests from this IP |
| `VALIDATION_ERROR` | Request validation failed |
| `INVALID_CONTENT_TYPE` | Invalid Content-Type header |
| `UNSUPPORTED_VERSION` | API version not supported |
| `DATABASE_ERROR` | Database operation failed |
| `INTERNAL_ERROR` | Internal server error |
| `INCOGNITO_MODE` | Operation disabled in incognito mode |

## 🔄 Migration Guide

### From V1 to V2
1. **Update endpoints**: Use `/api/v2/` prefix
2. **Request format**: V2 requires stricter validation
3. **Response format**: V2 includes more metadata
4. **Authentication**: V2 uses different auth headers

### Example Migration
```typescript
// V1 (old)
GET /api/favorites

// V2 (new)
GET /api/v2/favorites
Headers:
  API-Version: v2
```

## 📝 Best Practices

1. **Use versioned endpoints** for breaking changes
2. **Implement proper validation** for all inputs
3. **Handle rate limit errors** gracefully
4. **Log requests appropriately** for debugging
5. **Monitor health endpoints** for service status
6. **Use appropriate HTTP methods** for operations
7. **Include request IDs** for tracking
8. **Implement proper error handling** with meaningful messages

## 🧪 Testing

### Testing Rate Limiting
```bash
# Send 101 requests (should fail after 100)
for i in {1..101}; do
  curl -X GET http://localhost:3000/api/favorites
done
```

### Testing Validation
```bash
# Test invalid JSON
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"invalid": "json"}'

# Test missing required fields
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"title": "test"}'
```

### Testing Health Checks
```bash
# Simple health check
curl http://localhost:3000/api/health

# Detailed health check
curl -X POST http://localhost:3000/api/health

# Readiness check
curl -X PUT http://localhost:3000/api/health
```

## 🔮 Production Considerations

1. **Use Redis** for rate limiting in production
2. **Implement proper authentication** middleware
3. **Set up monitoring** for health endpoints
4. **Configure proper CORS** for your domain
5. **Use environment variables** for configuration
6. **Implement proper logging** and error tracking
7. **Set up alerts** for health check failures
8. **Consider API gateway** for additional security