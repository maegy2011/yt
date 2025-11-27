/**
 * Global Error Handler for API Routes
 * Provides centralized error handling for all API endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { AppError, ErrorUtils, asyncHandler } from '@/lib/errors'
import { createApiContext } from '@/lib/api/middleware'

// Error handler middleware for API routes
export function handleApiError(error: unknown, request?: NextRequest): NextResponse {
  const context = request ? createApiContext(request) : { requestId: 'unknown' }
  const appError = ErrorUtils.normalizeError(error)
  
  // Log the error with context
  ErrorUtils.logError(appError, {
    requestId: context.requestId,
    method: request?.method,
    url: request?.url,
    userAgent: request?.headers.get('user-agent'),
    ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip')
  })

  // Create error response
  const errorResponse = ErrorUtils.createErrorResponse(appError, context.requestId)
  
  return NextResponse.json(errorResponse, {
    status: appError.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Error-Code': appError.code,
      'X-Request-ID': context.requestId,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}

// Wrapper function for API routes with error handling
export function withErrorHandler<T extends NextRequest>(
  handler: (request: T, ...args: any[]) => Promise<NextResponse>
) {
  return asyncHandler(async (request: T, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      return handleApiError(error, request)
    }
  })
}

// Specific error handlers for common scenarios
export const ErrorHandlers = {
  // Handle validation errors from request body
  validationError: (message: string, field?: string, context?: Record<string, any>) => {
    throw new AppError(message, 400, 'VALIDATION_ERROR', true, {
      field,
      ...context
    })
  },

  // Handle not found errors
  notFound: (resource: string = 'Resource') => {
    throw new AppError(`${resource} not found`, 404, 'NOT_FOUND', true)
  },

  // Handle unauthorized errors
  unauthorized: (message: string = 'Authentication required') => {
    throw new AppError(message, 401, 'UNAUTHORIZED', true)
  },

  // Handle forbidden errors
  forbidden: (message: string = 'Access denied') => {
    throw new AppError(message, 403, 'FORBIDDEN', true)
  },

  // Handle conflict errors
  conflict: (message: string, context?: Record<string, any>) => {
    throw new AppError(message, 409, 'CONFLICT', true, context)
  },

  // Handle rate limit errors
  rateLimit: (message: string = 'Rate limit exceeded', retryAfter?: number) => {
    const error = new AppError(message, 429, 'RATE_LIMIT_EXCEEDED', true)
    if (retryAfter) {
      error.context = { retryAfter }
    }
    throw error
  },

  // Handle database errors
  database: (message: string, context?: Record<string, any>) => {
    throw new AppError(message, 500, 'DATABASE_ERROR', true, context)
  },

  // Handle external service errors
  externalService: (service: string, message: string) => {
    throw new AppError(`${service} error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', true, { service })
  },

  // Handle YouTube API errors
  youtubeApi: (message: string, statusCode: number = 500, context?: Record<string, any>) => {
    throw new AppError(`YouTube API error: ${message}`, statusCode, 'YOUTUBE_API_ERROR', true, context)
  },

  // Handle file upload errors
  fileUpload: (message: string, context?: Record<string, any>) => {
    throw new AppError(`File upload error: ${message}`, 400, 'FILE_UPLOAD_ERROR', true, context)
  }
}

// Error response helper functions
export const ErrorResponses = {
  // Create a standardized error response
  create: (
    message: string,
    statusCode: number = 500,
    code?: string,
    context?: Record<string, any>
  ): NextResponse => {
    const error = new AppError(message, statusCode, code, true, context)
    return handleApiError(error)
  },

  // Validation error response
  validation: (message: string, field?: string, context?: Record<string, any>) => {
    return ErrorHandlers.validationError(message, field, context)
  },

  // Not found error response
  notFound: (resource: string = 'Resource') => {
    return ErrorHandlers.notFound(resource)
  },

  // Unauthorized error response
  unauthorized: (message: string = 'Authentication required') => {
    return ErrorHandlers.unauthorized(message)
  },

  // Forbidden error response
  forbidden: (message: string = 'Access denied') => {
    return ErrorHandlers.forbidden(message)
  },

  // Conflict error response
  conflict: (message: string, context?: Record<string, any>) => {
    return ErrorHandlers.conflict(message, context)
  },

  // Rate limit error response
  rateLimit: (message: string = 'Rate limit exceeded', retryAfter?: number) => {
    return ErrorHandlers.rateLimit(message, retryAfter)
  },

  // Database error response
  database: (message: string, context?: Record<string, any>) => {
    return ErrorHandlers.database(message, context)
  },

  // External service error response
  externalService: (service: string, message: string) => {
    return ErrorHandlers.externalService(service, message)
  },

  // YouTube API error response
  youtubeApi: (message: string, statusCode: number = 500, context?: Record<string, any>) => {
    return ErrorHandlers.youtubeApi(message, statusCode, context)
  },

  // File upload error response
  fileUpload: (message: string, context?: Record<string, any>) => {
    return ErrorHandlers.fileUpload(message, context)
  }
}

// Higher-order function to wrap API route handlers with error handling
export function createApiRoute<T extends NextRequest>(
  handler: (request: T, ...args: any[]) => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean
    rateLimit?: {
      windowMs: number
      max: number
    }
    validation?: {
      schema: any
      source: 'body' | 'query' | 'params'
    }
  }
) {
  return withErrorHandler(async (request: T, ...args: any[]) => {
    // Add request ID to headers for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Execute the original handler
      const response = await handler(request, ...args)
      
      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId)
      
      return response
    } catch (error) {
      // Error will be handled by withErrorHandler
      throw error
    }
  })
}

// Error logging utility for API routes
export const ApiErrorLogger = {
  // Log API request errors
  logRequest: (
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    error?: Error,
    context?: Record<string, any>
  ) => {
    const logData = {
      method,
      url,
      statusCode,
      responseTime,
      timestamp: new Date().toISOString(),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      }),
      ...context
    }

    if (statusCode >= 500) {
      console.error('API Server Error:', logData)
    } else if (statusCode >= 400) {
      console.warn('API Client Error:', logData)
    } else {
      console.log('API Request:', logData)
    }
  },

  // Log performance metrics
  logPerformance: (
    route: string,
    method: string,
    responseTime: number,
    memoryUsage: NodeJS.MemoryUsage
  ) => {
    const logData = {
      route,
      method,
      responseTime,
      memoryUsage: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external
      },
      timestamp: new Date().toISOString()
    }

    if (responseTime > 5000) {
      console.warn('Slow API Request:', logData)
    }
  }
}

// Custom error classes for specific error types
export class ValidationError extends AppError {
  constructor(message: string, public field?: string, context?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, { field, ...context })
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, 'DATABASE_ERROR', true, context)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, 'CONFLICT', true, context)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 401, 'AUTHORIZATION_ERROR', true, context)
  }
}