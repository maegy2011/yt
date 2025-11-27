/**
 * Enhanced Error Handling System
 * Provides structured error handling with custom error classes and utilities
 */

// Base Application Error Class
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean
  public readonly timestamp: string
  public readonly requestId?: string
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)
    
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code || this.generateErrorCode(statusCode)
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()
    this.context = context

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  private generateErrorCode(statusCode: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT'
    }
    return codes[statusCode] || 'UNKNOWN_ERROR'
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      timestamp: this.timestamp,
      requestId: this.requestId,
      context: this.context,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    }
  }
}

// Validation Error (400)
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, context)
  }
}

// Authentication Errors (401)
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

// Authorization Errors (403)
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

// Not Found Error (404)
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

// Conflict Error (409)
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

// Unprocessable Entity Error (422)
export class UnprocessableEntityError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', true, context)
  }
}

// Rate Limit Error (429)
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

// Database Errors
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, 'DATABASE_ERROR', true, context)
  }
}

// External Service Errors
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`${service} error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', true, { service })
  }
}

// Configuration Error
export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(`Configuration error: ${message}`, 500, 'CONFIGURATION_ERROR', false)
  }
}

// YouTube API Specific Errors
export class YouTubeApiError extends AppError {
  constructor(message: string, statusCode: number = 500, context?: Record<string, any>) {
    super(`YouTube API error: ${message}`, statusCode, 'YOUTUBE_API_ERROR', true, context)
  }
}

// File Upload Errors
export class FileUploadError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(`File upload error: ${message}`, 400, 'FILE_UPLOAD_ERROR', true, context)
  }
}

// Cache Errors
export class CacheError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(`Cache error: ${message}`, 500, 'CACHE_ERROR', true, context)
  }
}

// Utility functions for error handling
export const ErrorUtils = {
  /**
   * Check if an error is operational (expected) vs programming error
   */
  isOperational(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational
    }
    return false
  },

  /**
   * Convert unknown error to AppError
   */
  normalizeError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error
    }

    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'ValidationError') {
        return new ValidationError(error.message)
      }
      
      if (error.name === 'CastError') {
        return new ValidationError('Invalid data format')
      }

      // Handle Prisma errors
      if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any
        switch (prismaError.code) {
          case 'P2002':
            return new ConflictError('Resource already exists')
          case 'P2025':
            return new NotFoundError('Resource')
          case 'P2003':
            return new ValidationError('Foreign key constraint violation')
          default:
            return new DatabaseError(`Database error: ${error.message}`)
        }
      }

      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        const zodError = error as any
        const issues = zodError.issues?.map((issue: any) => ({
          field: issue.path.join('.'),
          message: issue.message
        })) || []
        return new ValidationError('Validation failed', { issues })
      }

      // Generic error
      return new AppError(error.message, 500, 'UNKNOWN_ERROR', true)
    }

    // Handle string errors
    if (typeof error === 'string') {
      return new AppError(error, 500, 'UNKNOWN_ERROR', true)
    }

    // Handle unknown error types
    return new AppError('An unexpected error occurred', 500, 'UNKNOWN_ERROR', false)
  },

  /**
   * Create error response object
   */
  createErrorResponse(error: AppError, requestId?: string) {
    return {
      success: false,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        timestamp: error.timestamp,
        requestId,
        ...(error.context && { context: error.context }),
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          details: error.context 
        })
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString()
      }
    }
  },

  /**
   * Log error with context
   */
  logError(error: Error, context?: Record<string, any>) {
    const appError = this.normalizeError(error)
    
    const logData = {
      name: appError.name,
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      isOperational: appError.isOperational,
      timestamp: appError.timestamp,
      ...(context && { context }),
      ...(process.env.NODE_ENV === 'development' && { stack: appError.stack })
    }

    if (appError.isOperational) {
      console.warn('Operational Error:', logData)
    } else {
      console.error('Programming Error:', logData)
    }

    // In production, you might want to send errors to a monitoring service
    if (process.env.NODE_ENV === 'production' && !appError.isOperational) {
      // TODO: Send to error monitoring service (Sentry, etc.)
    }
  }
}

// Error handler middleware for Express/Next.js API routes
export function errorHandler(error: unknown, requestId?: string) {
  const appError = ErrorUtils.normalizeError(error)
  ErrorUtils.logError(appError, { requestId })
  
  return ErrorUtils.createErrorResponse(appError, requestId)
}

// Async error wrapper for API routes
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return Promise.resolve(fn(...args)).catch((error) => {
      throw ErrorUtils.normalizeError(error)
    })
  }
}

// Type guard for checking error types
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

// Error boundary fallback component data
export const ERROR_FALLBACKS = {
  GENERIC: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again later.',
    action: 'Go back home'
  },
  NETWORK: {
    title: 'Network error',
    message: 'Unable to connect to the server. Please check your connection.',
    action: 'Retry'
  },
  NOT_FOUND: {
    title: 'Page not found',
    message: 'The page you are looking for does not exist.',
    action: 'Go home'
  },
  PERMISSION: {
    title: 'Access denied',
    message: 'You do not have permission to access this resource.',
    action: 'Go back'
  }
} as const