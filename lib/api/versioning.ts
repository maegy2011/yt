import { NextRequest, NextResponse } from 'next/server'
import { createApiContext, createErrorResponse, createSuccessResponse } from '../middleware'

// API version configuration
export interface ApiVersionConfig {
  version: string
  deprecated?: boolean
  sunsetDate?: Date
  migrationGuide?: string
  supportedUntil?: Date
}

// Available API versions
export const API_VERSIONS: Record<string, ApiVersionConfig> = {
  'v1': {
    version: 'v1',
    deprecated: false
  },
  'v2': {
    version: 'v2',
    deprecated: false
  }
}

// Default API version
export const DEFAULT_API_VERSION = 'v1'

// Extract version from request
export function extractApiVersion(request: NextRequest): string {
  const url = new URL(request.url)
  
  // Try to get version from URL path (/api/v1/...)
  const pathParts = url.pathname.split('/')
  const apiIndex = pathParts.indexOf('api')
  
  if (apiIndex !== -1 && pathParts.length > apiIndex + 1) {
    const potentialVersion = pathParts[apiIndex + 1]
    if (potentialVersion.startsWith('v') && API_VERSIONS[potentialVersion]) {
      return potentialVersion
    }
  }
  
  // Try to get version from query parameter (?version=v1)
  const queryVersion = url.searchParams.get('version')
  if (queryVersion && API_VERSIONS[queryVersion]) {
    return queryVersion
  }
  
  // Try to get version from header (API-Version: v1)
  const headerVersion = request.headers.get('api-version')
  if (headerVersion && API_VERSIONS[headerVersion]) {
    return headerVersion
  }
  
  // Fallback to default version
  return DEFAULT_API_VERSION
}

// Check if version is supported
export function isVersionSupported(version: string): boolean {
  const config = API_VERSIONS[version]
  if (!config) {
    return false
  }
  
  // If version is deprecated but still supported
  if (config.deprecated && config.supportedUntil) {
    return new Date() <= config.supportedUntil
  }
  
  // If version is not deprecated
  return !config.deprecated
}

// Get version response headers
export function getVersionHeaders(version: string): Record<string, string> {
  const config = API_VERSIONS[version]
  const headers: Record<string, string> = {
    'API-Version': version,
    'Supported-Versions': Object.keys(API_VERSIONS).join(', ')
  }
  
  if (config?.deprecated) {
    headers['Deprecation'] = 'true'
    if (config.sunsetDate) {
      headers['Sunset-Date'] = config.sunsetDate.toISOString()
    }
    if (config.migrationGuide) {
      headers['Migration-Guide'] = config.migrationGuide
    }
  }
  
  return headers
}

// Version middleware wrapper
export function withVersioning(
  handler: (request: NextRequest, context: any, version: string) => Promise<NextResponse>
) {
  return async function(request: NextRequest): Promise<NextResponse> {
    const context = createApiContext(request)
    const version = extractApiVersion(request)
    
    // Check if version is supported
    if (!isVersionSupported(version)) {
      const response = createErrorResponse(
        context,
        'UNSUPPORTED_VERSION',
        `API version ${version} is not supported. Supported versions: ${Object.keys(API_VERSIONS).join(', ')}`,
        400
      )
      
      // Add version headers
      Object.entries(getVersionHeaders(version)).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    }
    
    // Add version headers to all responses
    const versionHeaders = getVersionHeaders(version)
    
    try {
      const response = await handler(request, context, version)
      
      // Add version headers to response
      Object.entries(versionHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    } catch (error) {
      const response = createErrorResponse(
        context,
        'INTERNAL_ERROR',
        'Internal server error',
        500,
        error
      )
      
      // Add version headers to error response
      Object.entries(versionHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    }
  }
}

// Version-specific route handlers
export const versionedHandlers = {
  // V1 handlers (current implementation)
  v1: {
    // Import and wrap existing handlers
    // These will be implemented when updating existing routes
  },
  
  // V2 handlers (future implementation)
  v2: {
    // Future V2 implementations can go here
  }
}

// Helper to create versioned route
export function createVersionedRoute(
  version: string,
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return withVersioning(async (request: NextRequest, context: any, requestVersion: string) => {
    if (requestVersion !== version) {
      const response = createErrorResponse(
        context,
        'VERSION_MISMATCH',
        `This endpoint is only available in API version ${version}`,
        400
      )
      
      Object.entries(getVersionHeaders(requestVersion)).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    }
    
    return handler(request, context)
  })
}

// Version deprecation warning
export function logVersionUsage(version: string, endpoint: string): void {
  const config = API_VERSIONS[version]
  if (config?.deprecated) {
    console.warn(`[API DEPRECATION] Using deprecated API version ${version} for endpoint ${endpoint}`)
    
    if (config.sunsetDate) {
      const daysUntilSunset = Math.ceil((config.sunsetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      console.warn(`[API DEPRECATION] Version ${version} will be sunset on ${config.sunsetDate.toISOString()} (${daysUntilSunset} days)`)
    }
    
    if (config.migrationGuide) {
      console.warn(`[API DEPRECATION] Migration guide: ${config.migrationGuide}`)
    }
  }
}

// API version info endpoint
export async function getVersionInfo(request: NextRequest): Promise<NextResponse> {
  const context = createApiContext(request)
  const currentVersion = extractApiVersion(request)
  
  const versionInfo = {
    current: currentVersion,
    default: DEFAULT_API_VERSION,
    supported: Object.entries(API_VERSIONS).map(([key, config]) => ({
      version: key,
      deprecated: config.deprecated,
      sunsetDate: config.sunsetDate?.toISOString(),
      supportedUntil: config.supportedUntil?.toISOString(),
      migrationGuide: config.migrationGuide
    }))
  }
  
  const response = createSuccessResponse(context, versionInfo)
  
  // Add version headers
  Object.entries(getVersionHeaders(currentVersion)).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}