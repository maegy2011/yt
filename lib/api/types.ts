// API middleware types and utilities

export interface RateLimitConfig {
  windowMs: number
  max: number
  message?: string
  standardHeaders?: boolean
  legacyHeaders?: boolean
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: Date
  retryAfter?: number
}

export interface ApiMiddlewareConfig {
  rateLimit?: RateLimitConfig
  cors?: {
    origin: string[] | '*'
    credentials?: boolean
    methods?: string[]
    headers?: string[]
  }
  validation?: {
    body?: boolean
    query?: boolean
    headers?: boolean
  }
  logging?: {
    enabled: boolean
    level: 'error' | 'warn' | 'info' | 'debug'
    excludePaths?: string[]
  }
  security?: {
    enableCSRF?: boolean
    enableXSS?: boolean
    enableContentType?: boolean
  }
}

export interface ApiContext {
  request: Request
  response: Response
  startTime: number
  requestId: string
  ip: string
  userAgent?: string
  method: string
  url: string
  path: string
  query: Record<string, string>
  headers: Record<string, string>
}

export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
  requestId: string
  path: string
  method: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: {
    requestId: string
    timestamp: string
    version: string
    pagination?: {
      page: number
      limit: number
      total: number
      hasMore: boolean
    }
  }
}

export interface ValidationError {
  field: string
  message: string
  value?: any
  code?: string
}

export interface RequestValidationResult {
  isValid: boolean
  errors: ValidationError[]
  data?: any
}