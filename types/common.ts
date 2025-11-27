// Common API and utility types

export interface RequestHeaders {
  [key: string]: string
}

export interface SearchParams {
  [key: string]: string | string[] | undefined
}

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  search?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  [key: string]: any
}

export interface ApiQueryParams extends PaginationParams, SortParams, FilterParams {
  [key: string]: any
}

// Database query types
export interface DatabaseQuery {
  where?: Record<string, any>
  orderBy?: Record<string, 'asc' | 'desc'>
  include?: Record<string, boolean | any>
  select?: Record<string, boolean>
  take?: number
  skip?: number
}

export interface DatabaseResult<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// File upload types
export interface FileUpload {
  file: File
  filename: string
  mimetype: string
  size: number
  buffer?: ArrayBuffer
}

export interface UploadedFile {
  id: string
  filename: string
  originalName: string
  path: string
  mimetype: string
  size: number
  uploadedAt: string
}

// Configuration types
export interface AppConfig {
  database: {
    url: string
    maxConnections?: number
  }
  api: {
    rateLimit?: {
      windowMs: number
      max: number
    }
    cors?: {
      origin: string[]
      credentials: boolean
    }
  }
  youtube?: {
    apiKey?: string
    cacheTimeout?: number
  }
}

// Environment variable types
export interface EnvVars {
  NODE_ENV: 'development' | 'production' | 'test'
  DATABASE_URL: string
  NEXTAUTH_SECRET?: string
  NEXTAUTH_URL?: string
  YOUTUBE_API_KEY?: string
  [key: string]: string | undefined
}

// Logging types
export interface LogEntry {
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  context?: Record<string, any>
  error?: Error
}

// Cache types
export interface CacheEntry<T = any> {
  key: string
  value: T
  timestamp: number
  ttl?: number
}

export interface CacheOptions {
  ttl?: number
  maxSize?: number
  strategy?: 'lru' | 'fifo' | 'lfu'
}

// WebSocket types
export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  id?: string
}

export interface WebSocketClient {
  id: string
  socket: any
  lastPing: number
  isConnected: boolean
}

// Validation types
export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  data?: any
}

// Export/Import types
export interface ExportOptions {
  format: 'json' | 'csv' | 'xml'
  fields?: string[]
  filters?: FilterParams
}

export interface ImportResult {
  total: number
  successful: number
  failed: number
  errors: Array<{
    row: number
    error: string
    data: any
  }>
}