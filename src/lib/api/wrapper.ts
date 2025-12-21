import { NextRequest, NextResponse } from 'next/server'
import { createRateLimit, RateLimitConfig } from './middleware'
import { withVersioning } from './versioning'
import { addCORSHeaders, addSecurityHeaders, createApiContext, logRequest, recordRequestMetrics } from './middleware'
import { ApiMiddlewareConfig } from './types'

// Default middleware configuration
export const DEFAULT_MIDDLEWARE_CONFIG: ApiMiddlewareConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests from this IP'
  },
  cors: {
    origin: ['http://localhost:3000', 'https://yourdomain.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  validation: {
    body: true,
    query: true,
    headers: false
  },
  logging: {
    enabled: true,
    level: 'info',
    excludePaths: ['/api/health', '/api/metrics']
  },
  security: {
    enableCSRF: true,
    enableXSS: true,
    enableContentType: true
  }
}

// Main middleware wrapper
export function withMiddleware(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  config: Partial<ApiMiddlewareConfig> = {}
) {
  const finalConfig = {
    rateLimit: { 
      windowMs: DEFAULT_MIDDLEWARE_CONFIG.rateLimit?.windowMs || 15 * 60 * 1000,
      max: DEFAULT_MIDDLEWARE_CONFIG.rateLimit?.max || 100,
      message: DEFAULT_MIDDLEWARE_CONFIG.rateLimit?.message || 'Too many requests from this IP',
      ...config.rateLimit 
    },
    cors: { ...DEFAULT_MIDDLEWARE_CONFIG.cors, ...config.cors },
    validation: { ...DEFAULT_MIDDLEWARE_CONFIG.validation, ...config.validation },
    logging: { ...DEFAULT_MIDDLEWARE_CONFIG.logging, ...config.logging },
    security: { ...DEFAULT_MIDDLEWARE_CONFIG.security, ...config.security }
  }

  return async function(request: NextRequest): Promise<NextResponse> {
    const context = createApiContext(request)
    const startTime = Date.now()
    
    try {
      // 1. Rate limiting
      if (finalConfig.rateLimit) {
        const rateLimit = createRateLimit(finalConfig.rateLimit)
        const rateLimitResult = rateLimit(request)
        
        if (!rateLimitResult.success) {
          const response = await import('./middleware').then(m => 
            m.createRateLimitResponse(context, rateLimitResult)
          )
          logRequest(context, 429, Date.now() - startTime)
          return response
        }
      }
      
      // 2. Content type validation
      if (finalConfig.security?.enableContentType && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const response = await import('./middleware').then(m => 
            m.createErrorResponse(context, 'INVALID_CONTENT_TYPE', 'Content-Type must be application/json', 400)
          )
          logRequest(context, 400, Date.now() - startTime)
          return response
        }
      }
      
      // 3. Execute handler
      const response = await handler(request, context)
      
      // 4. Add security headers
      if (finalConfig.security) {
        addSecurityHeaders(response)
      }
      
      // 5. Add CORS headers
      if (finalConfig.cors) {
        addCORSHeaders(
          response,
          finalConfig.cors.origin || '*',
          finalConfig.cors.credentials,
          finalConfig.cors.methods,
          finalConfig.cors.headers
        )
      }
      
      // 6. Log request
      if (finalConfig.logging?.enabled) {
        const shouldLog = !finalConfig.logging.excludePaths?.some(path => 
          context.path.startsWith(path)
        )
        
        if (shouldLog) {
          logRequest(context, response.status, Date.now() - startTime)
        }
      }
      
      // 7. Record metrics
      recordRequestMetrics(response.status >= 200 && response.status < 400, Date.now() - startTime)
      
      return response
      
    } catch (error) {
      // Error handling
      const response = await import('./middleware').then(m => 
        m.createErrorResponse(context, 'INTERNAL_ERROR', 'Internal server error', 500, error)
      )
      
      if (finalConfig.security) {
        addSecurityHeaders(response)
      }
      
      if (finalConfig.cors) {
        addCORSHeaders(
          response,
          finalConfig.cors.origin || '*',
          finalConfig.cors.credentials,
          finalConfig.cors.methods,
          finalConfig.cors.headers
        )
      }
      
      if (finalConfig.logging?.enabled) {
        logRequest(context, 500, Date.now() - startTime, error)
      }
      
      recordRequestMetrics(false, Date.now() - startTime)
      
      return response
    }
  }
}

// Validation middleware wrapper
export function withValidation<T>(
  schema: any,
  validator: (request: NextRequest, context: any) => Promise<any>,
  config: Partial<ApiMiddlewareConfig> = {}
) {
  return withMiddleware(async (request: NextRequest, context: any) => {
    // Simple validation - check if request has valid JSON body for POST requests
    if (request.method === 'POST') {
      try {
        await request.json()
      } catch (error) {
        const response = await import('./middleware').then(m => 
          m.createErrorResponse(context, 'VALIDATION_ERROR', 'Invalid JSON in request body', 400)
        )
        return response
      }
    }
    
    return await validator(request, context)
  }, config)
}

// Route-specific middleware combinations
export const routeMiddleware = {
  // For public endpoints (rate limiting only)
  public: (handler: (request: NextRequest, context: any) => Promise<NextResponse>) =>
    withMiddleware(handler, {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
      cors: { origin: '*' }
    }),
  
  // For authenticated endpoints (rate limiting + validation)
  authenticated: (handler: (request: NextRequest, context: any) => Promise<NextResponse>) =>
    withMiddleware(handler, {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 200 },
      cors: { origin: ['http://localhost:3000'], credentials: true }
    }),
  
  // For admin endpoints (strict rate limiting)
  admin: (handler: (request: NextRequest, context: any) => Promise<NextResponse>) =>
    withMiddleware(handler, {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 50 },
      cors: { origin: ['http://localhost:3000'], credentials: true }
    }),
  
  // For file upload endpoints (different rate limits)
  upload: (handler: (request: NextRequest, context: any) => Promise<NextResponse>) =>
    withMiddleware(handler, {
      rateLimit: { windowMs: 60 * 60 * 1000, max: 10 }, // 10 uploads per hour
      cors: { origin: ['http://localhost:3000'], credentials: true }
    })
}

// Pre-built middleware for common patterns
export const middleware = {
  // Health check middleware (no rate limiting)
  health: (handler: (request: NextRequest, context: any) => Promise<NextResponse>) =>
    withMiddleware(handler, {
      rateLimit: undefined,
      logging: { enabled: false, level: 'info' }
    }),
  
  // Search endpoints (higher rate limits)
  search: (handler: (request: NextRequest, context: any) => Promise<NextResponse>) =>
    withMiddleware(handler, {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 200 }
    }),
  
  // CRUD operations
  crud: (handler: (request: NextRequest, context: any) => Promise<NextResponse>) =>
    withMiddleware(handler, {
      rateLimit: { windowMs: 15 * 60 * 1000, max: 150 }
    })
}

// Export all middleware utilities
export {
  createRateLimit,
  withVersioning,
  addCORSHeaders,
  addSecurityHeaders,
  createApiContext,
  logRequest,
  recordRequestMetrics
}