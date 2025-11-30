import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ValidationError, RequestValidationResult } from './types'

// Common validation schemas
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).optional()
  }),
  
  // Search query
  searchQuery: z.object({
    query: z.string().min(1).max(200),
    type: z.enum(['video', 'playlist', 'channel', 'all']).default('all'),
    continuation: z.string().optional(),
    page: z.coerce.number().min(1).default(1)
  }),
  
  // Video ID
  videoId: z.object({
    videoId: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/)
  }),
  
  // Channel ID
  channelId: z.object({
    channelId: z.string().min(3).max(100).regex(/^[a-zA-Z0-9_-]+$/)
  }),
  
  // Favorite video
  favoriteVideo: z.object({
    videoId: z.string().min(3).max(20),
    title: z.string().min(1).max(200),
    channelName: z.string().min(1).max(100),
    thumbnail: z.string().url().optional(),
    duration: z.union([z.string(), z.number()]).optional(),
    viewCount: z.union([z.string(), z.number()]).optional()
  }),
  
  // Watched video
  watchedVideo: z.object({
    videoId: z.string().min(3).max(20),
    title: z.string().min(1).max(200),
    channelName: z.string().min(1).max(100),
    thumbnail: z.string().url().optional(),
    duration: z.union([z.string(), z.number()]).optional(),
    viewCount: z.union([z.string(), z.number()]).optional()
  }),
  
  // Video note
  videoNote: z.object({
    videoId: z.string().min(3).max(20),
    title: z.string().min(1).max(200),
    note: z.string().min(1).max(1000),
    channelName: z.string().min(1).max(100).optional(),
    thumbnail: z.string().url().optional(),
    startTime: z.coerce.number().min(0).max(43200).optional(),
    endTime: z.coerce.number().min(0).max(43200).optional(),
    fontSize: z.coerce.number().min(8).max(32).default(16),
    isClip: z.boolean().default(false)
  }),
  
  // Notebook
  notebook: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(500).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3b82f6'),
    isPublic: z.boolean().default(false),
    tags: z.string().max(200).default(''),
    category: z.string().max(50).default('general')
  }),
  
  // Blacklist item
  blacklistItem: z.object({
    itemId: z.string().min(1).max(100),
    title: z.string().min(1).max(200),
    type: z.enum(['video', 'playlist', 'channel']),
    thumbnail: z.string().url().optional(),
    channelName: z.string().min(1).max(100).optional()
  }),
  
  // Batch operations
  batchOperation: z.object({
    operation: z.enum(['create', 'update', 'delete']),
    items: z.array(z.any()).min(1).max(100)
  })
}

// Content type validation
export function validateContentType(request: NextRequest, allowedTypes: string[] = ['application/json']): boolean {
  const contentType = request.headers.get('content-type')
  
  if (!contentType) {
    return false
  }
  
  return allowedTypes.some(type => contentType.toLowerCase().includes(type.toLowerCase()))
}

// Request body validation
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<RequestValidationResult> {
  try {
    // Check content type
    if (!validateContentType(request)) {
      return {
        isValid: false,
        errors: [{
          field: 'body',
          message: 'Invalid content type. Expected application/json',
          code: 'INVALID_CONTENT_TYPE'
        }]
      }
    }
    
    // Parse and validate body
    const body = await request.json()
    const result = schema.safeParse(body)
    
    if (!result.success) {
      const errors: ValidationError[] = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        value: undefined, // Zod issue doesn't have received property in this version
        code: issue.code
      }))
      
      return {
        isValid: false,
        errors
      }
    }
    
    return {
      isValid: true,
      errors: [],
      data: result.data
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        field: 'body',
        message: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      }]
    }
  }
}

// Query parameter validation
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): RequestValidationResult {
  try {
    const { searchParams } = new URL(request.url)
    const params: Record<string, any> = {}
    
    // Convert URLSearchParams to object
    for (const [key, value] of searchParams.entries()) {
      params[key] = value
    }
    
    const result = schema.safeParse(params)
    
    if (!result.success) {
      const errors: ValidationError[] = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        value: undefined, // Zod issue doesn't have received property in this version
        code: issue.code
      }))
      
      return {
        isValid: false,
        errors
      }
    }
    
    return {
      isValid: true,
      errors: [],
      data: result.data
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        field: 'query',
        message: 'Invalid query parameters',
        code: 'INVALID_QUERY_PARAMS'
      }]
    }
  }
}

// Path parameter validation
export function validatePathParams<T>(
  params: Record<string, string>,
  schema: z.ZodSchema<T>
): RequestValidationResult {
  try {
    const result = schema.safeParse(params)
    
    if (!result.success) {
      const errors: ValidationError[] = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        value: undefined, // Zod issue doesn't have received property in this version
        code: issue.code
      }))
      
      return {
        isValid: false,
        errors
      }
    }
    
    return {
      isValid: true,
      errors: [],
      data: result.data
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        field: 'params',
        message: 'Invalid path parameters',
        code: 'INVALID_PATH_PARAMS'
      }]
    }
  }
}

// Header validation
export function validateHeaders<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): RequestValidationResult {
  try {
    const headers: Record<string, string> = {}
    
    // Convert Headers to object
    for (const [key, value] of request.headers.entries()) {
      headers[key] = value
    }
    
    const result = schema.safeParse(headers)
    
    if (!result.success) {
      const errors: ValidationError[] = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        value: undefined, // Zod issue doesn't have received property in this version
        code: issue.code
      }))
      
      return {
        isValid: false,
        errors
      }
    }
    
    return {
      isValid: true,
      errors: [],
      data: result.data
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        field: 'headers',
        message: 'Invalid headers',
        code: 'INVALID_HEADERS'
      }]
    }
  }
}

// Custom validation rules
export const customValidators = {
  // YouTube video ID validation
  isValidYouTubeVideoId: (videoId: string): boolean => {
    return /^[a-zA-Z0-9_-]{8,20}$/.test(videoId)
  },
  
  // YouTube channel ID validation
  isValidYouTubeChannelId: (channelId: string): boolean => {
    return /^[a-zA-Z0-9_-]{3,100}$/.test(channelId) || /^UC[a-zA-Z0-9_-]{22}$/.test(channelId)
  },
  
  // URL validation
  isValidURL: (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },
  
  // Email validation
  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  },
  
  // Sanitize string input
  sanitizeString: (input: string, maxLength: number = 1000): string => {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .slice(0, maxLength)
  }
}

// Middleware wrapper for validation
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  validator: (request: NextRequest, schema: z.ZodSchema<T>) => Promise<RequestValidationResult>
) {
  return async function(request: NextRequest): Promise<RequestValidationResult> {
    return validator(request, schema)
  }
}

// Pre-built validation middleware
export const validationMiddleware = {
  // Validate search query
  validateSearchQuery: (request: NextRequest) => validateQueryParams(request, commonSchemas.searchQuery),
  
  // Validate pagination
  validatePagination: (request: NextRequest) => validateQueryParams(request, commonSchemas.pagination),
  
  // Validate video ID from params
  validateVideoId: (params: Record<string, string>) => validatePathParams(params, commonSchemas.videoId),
  
  // Validate channel ID from params
  validateChannelId: (params: Record<string, string>) => validatePathParams(params, commonSchemas.channelId),
  
  // Validate favorite video body
  validateFavoriteVideo: (request: NextRequest) => validateRequestBody(request, commonSchemas.favoriteVideo),
  
  // Validate watched video body
  validateWatchedVideo: (request: NextRequest) => validateRequestBody(request, commonSchemas.watchedVideo),
  
  // Validate video note body
  validateVideoNote: (request: NextRequest) => validateRequestBody(request, commonSchemas.videoNote),
  
  // Validate notebook body
  validateNotebook: (request: NextRequest) => validateRequestBody(request, commonSchemas.notebook),
  
  // Validate blacklist item body
  validateBlacklistItem: (request: NextRequest) => validateRequestBody(request, commonSchemas.blacklistItem),
  
  // Validate batch operation body
  validateBatchOperation: (request: NextRequest) => validateRequestBody(request, commonSchemas.batchOperation)
}