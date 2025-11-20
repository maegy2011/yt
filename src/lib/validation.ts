// Input validation and sanitization utilities

/**
 * Sanitizes a string by removing potentially dangerous characters
 */
export function sanitizeString(input: any, maxLength: number = 1000): string {
  if (input === null || input === undefined) return ''
  
  const str = String(input)
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .slice(0, maxLength)
  
  return str
}

/**
 * Validates and sanitizes a search query
 */
export function validateSearchQuery(query: any): { isValid: boolean; sanitized: string; error?: string } {
  if (!query || typeof query !== 'string') {
    return { isValid: false, sanitized: '', error: 'Search query is required' }
  }
  
  const trimmed = query.trim()
  if (trimmed.length === 0) {
    return { isValid: false, sanitized: '', error: 'Search query cannot be empty' }
  }
  
  if (trimmed.length > 200) {
    return { isValid: false, sanitized: '', error: 'Search query is too long (max 200 characters)' }
  }
  
  // Check for potentially dangerous content
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return { isValid: false, sanitized: '', error: 'Search query contains invalid characters' }
    }
  }
  
  const sanitized = sanitizeString(trimmed, 200)
  return { isValid: true, sanitized }
}

/**
 * Validates video ID format
 */
export function validateVideoId(videoId: any): { isValid: boolean; sanitized: string; error?: string } {
  if (!videoId || typeof videoId !== 'string') {
    return { isValid: false, sanitized: '', error: 'Video ID is required' }
  }
  
  const trimmed = videoId.trim()
  if (trimmed.length === 0) {
    return { isValid: false, sanitized: '', error: 'Video ID cannot be empty' }
  }
  
  // YouTube video IDs are typically 11 characters
  if (trimmed.length < 8 || trimmed.length > 20) {
    return { isValid: false, sanitized: '', error: 'Invalid video ID length' }
  }
  
  // Check for valid characters
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { isValid: false, sanitized: '', error: 'Video ID contains invalid characters' }
  }
  
  return { isValid: true, sanitized: trimmed }
}

/**
 * Validates channel ID format
 */
export function validateChannelId(channelId: any): { isValid: boolean; sanitized: string; error?: string } {
  if (!channelId || typeof channelId !== 'string') {
    return { isValid: false, sanitized: '', error: 'Channel ID is required' }
  }
  
  const trimmed = channelId.trim()
  if (trimmed.length === 0) {
    return { isValid: false, sanitized: '', error: 'Channel ID cannot be empty' }
  }
  
  // Channel IDs can be UC... (24 chars) or custom usernames
  if (trimmed.length < 3 || trimmed.length > 100) {
    return { isValid: false, sanitized: '', error: 'Invalid channel ID length' }
  }
  
  // Check for valid characters
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { isValid: false, sanitized: '', error: 'Channel ID contains invalid characters' }
  }
  
  return { isValid: true, sanitized: trimmed }
}

/**
 * Validates and sanitizes note content
 */
export function validateNoteContent(title: any, comment: any): { 
  isValid: boolean; 
  sanitized: { title: string; comment: string }; 
  error?: string 
} {
  const sanitizedTitle = sanitizeString(title, 200)
  const sanitizedComment = sanitizeString(comment, 1000)
  
  if (!sanitizedTitle || sanitizedTitle.length === 0) {
    return { 
      isValid: false, 
      sanitized: { title: '', comment: '' }, 
      error: 'Note title is required' 
    }
  }
  
  return { 
    isValid: true, 
    sanitized: { title: sanitizedTitle, comment: sanitizedComment } 
  }
}

/**
 * Validates numeric input (view count, subscriber count, etc.)
 */
export function validateNumericInput(value: any, fieldName: string = 'Value'): { 
  isValid: boolean; 
  sanitized: number | null; 
  error?: string 
} {
  if (value === null || value === undefined || value === '') {
    return { isValid: true, sanitized: null }
  }
  
  const num = Number(value)
  
  if (isNaN(num)) {
    return { 
      isValid: false, 
      sanitized: null, 
      error: `${fieldName} must be a valid number` 
    }
  }
  
  if (num < 0) {
    return { 
      isValid: false, 
      sanitized: null, 
      error: `${fieldName} cannot be negative` 
    }
  }
  
  if (num > Number.MAX_SAFE_INTEGER) {
    return { 
      isValid: false, 
      sanitized: null, 
      error: `${fieldName} is too large` 
    }
  }
  
  return { isValid: true, sanitized: num }
}

/**
 * Validates time input for video notes (in seconds)
 */
export function validateTimeInput(value: any, fieldName: string = 'Time'): { 
  isValid: boolean; 
  sanitized: number; 
  error?: string 
} {
  const num = Number(value)
  
  if (isNaN(num)) {
    return { 
      isValid: false, 
      sanitized: 0, 
      error: `${fieldName} must be a valid number` 
    }
  }
  
  if (num < 0) {
    return { 
      isValid: false, 
      sanitized: 0, 
      error: `${fieldName} cannot be negative` 
    }
  }
  
  // Maximum 12 hours
  if (num > 43200) {
    return { 
      isValid: false, 
      sanitized: 0, 
      error: `${fieldName} cannot exceed 12 hours` 
    }
  }
  
  return { isValid: true, sanitized: Math.floor(num) }
}

/**
 * Generic validation for API request bodies
 */
export function validateRequestBody(body: any, requiredFields: string[]): { 
  isValid: boolean; 
  error?: string 
} {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Invalid request body' }
  }
  
  for (const field of requiredFields) {
    if (!(field in body) || body[field] === null || body[field] === undefined) {
      return { isValid: false, error: `Missing required field: ${field}` }
    }
  }
  
  return { isValid: true }
}