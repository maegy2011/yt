/**
 * Favorites API Route
 * 
 * This API route handles CRUD operations for user's favorite videos.
 * It supports GET (list favorites), POST (add favorite), and DELETE (remove favorite) operations.
 * 
 * Features:
 * - Pagination support for large favorite lists
 * - Input validation and sanitization
 * - Incognito mode support
 * - Error handling with proper HTTP status codes
 * - Database cleanup for invalid entries
 * - Optimized database queries
 * 
 * Endpoints:
 * - GET /api/favorites - Retrieve all favorite videos
 * - POST /api/favorites - Add a new favorite video
 * - DELETE /api/favorites?videoId=xxx - Remove a favorite video
 * 
 * @author MyTube Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'

// Database and utilities
import { db } from '@/lib/db'
import { sanitizeVideoId, isValidYouTubeVideoId } from '@/lib/youtube-utils'
import { isIncognitoRequest, shouldSkipInIncognito, createIncognitoResponse } from '@/lib/incognito-utils'

// Error handling and middleware
import { 
  withErrorHandler, 
  ErrorHandlers, 
  ValidationError, 
  ConflictError, 
  DatabaseError,
  AuthorizationError 
} from '@/lib/api/error-handler'
import { createApiContext, createSuccessResponse } from '@/lib/api/middleware'
import { optimizedQueries } from '@/lib/db'

// ============================================================================
// GET FAVORITES
// ============================================================================

/**
 * GET /api/favorites - Retrieve all favorite videos
 * 
 * Returns a paginated list of user's favorite videos with metadata.
 * Automatically cleans up invalid entries and returns properly formatted data.
 * 
 * @param request - Next.js request object
 * @returns {Promise<NextResponse>} JSON response with favorites data
 * 
 * Query Parameters:
 * - limit (optional): Number of items per page (default: 100)
 * - offset (optional): Number of items to skip (default: 0)
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: [...],
 *   pagination: {
 *     page: 1,
 *     limit: 100,
 *     total: 150,
 *     hasMore: true
 *   }
 * }
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const context = createApiContext(request)
  
  // Verify database connection
  if (!db) {
    throw new DatabaseError('Database connection not available')
  }
  
  // Use optimized query with pagination for better performance
  const { result } = await optimizedQueries.getFavoriteVideos({
    limit: 100, // Reasonable default limit to prevent memory issues
    offset: 0
  })
  
  // Filter out entries with invalid video IDs and format dates
  const validFavorites = result.videos
    .filter(favorite => 
      favorite.videoId && isValidYouTubeVideoId(favorite.videoId)
    )
    .map(favorite => ({
      ...favorite,
      addedAt: favorite.addedAt.toISOString(),
      updatedAt: favorite.updatedAt.toISOString()
    }))
  
  // Identify invalid entries for cleanup (async operation to avoid delaying response)
  const invalidFavorites = result.videos.filter(favorite => 
    !favorite.videoId || !isValidYouTubeVideoId(favorite.videoId)
  )
  
  // Clean up invalid entries from database (fire-and-forget pattern)
  if (invalidFavorites.length > 0) {
    Promise.all(
      invalidFavorites.map(favorite => 
        db.favoriteVideo.delete({ where: { id: favorite.id } })
      )
    ).catch(() => {
      // Cleanup errors are non-critical, log but don't fail the request
      console.warn('Failed to cleanup invalid favorites:', invalidFavorites.length)
    })
  }
  
  return createSuccessResponse(context, validFavorites, {
    pagination: {
      page: 1,
      limit: 100,
      total: result.total,
      hasMore: result.hasMore
    }
  })
})

// ============================================================================
// ADD FAVORITE
// ============================================================================

/**
 * POST /api/favorites - Add a new favorite video
 * 
 * Adds a video to the user's favorites list with validation and error handling.
 * Prevents duplicate entries and validates all input data.
 * 
 * @param request - Next.js request object with video data in body
 * @returns {Promise<NextResponse>} JSON response with created favorite data
 * 
 * Request Body:
 * {
 *   videoId: string (required) - YouTube video ID
 *   title: string (optional) - Video title
 *   channelName: string (optional) - Channel name
 *   thumbnail: string (optional) - Video thumbnail URL
 *   duration: string|number (optional) - Video duration
 *   viewCount: string|number (optional) - View count
 * }
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     id: string,
 *     videoId: string,
 *     title: string,
 *     ...
 *   }
 * }
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const context = createApiContext(request)
  const isIncognito = isIncognitoRequest(request)
  
  // Skip saving favorites in incognito mode for privacy
  if (shouldSkipInIncognito(isIncognito)) {
    throw new AuthorizationError('Favorites are disabled in incognito mode')
  }
  
  // Parse and validate request body
  let body: any
  try {
    body = await request.json()
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body')
  }
  
  const { videoId, title, channelName, thumbnail, duration, viewCount } = body

  // Validate required field
  if (!videoId) {
    throw new ValidationError('Video ID is required', 'videoId')
  }

  // Validate and sanitize video ID to prevent injection attacks
  const sanitizedVideoId = sanitizeVideoId(videoId)
  
  if (!sanitizedVideoId) {
    throw new ValidationError('Invalid video ID format', 'videoId')
  }

  // Validate optional string fields
  const stringFields = [
    { name: 'title', value: title },
    { name: 'channelName', value: channelName },
    { name: 'thumbnail', value: thumbnail }
  ]
  
  for (const field of stringFields) {
    if (field.value !== undefined && typeof field.value !== 'string') {
      throw new ValidationError(`${field.name} must be a string`, field.name)
    }
  }
  
  // Validate viewCount (allow both string and number formats)
  if (viewCount !== undefined && typeof viewCount !== 'string' && typeof viewCount !== 'number') {
    throw new ValidationError('View count must be a string or number', 'viewCount')
  }

  // Convert duration and viewCount to strings for database consistency
  const durationStr = duration ? duration.toString() : undefined
  const viewCountStr = viewCount ? viewCount.toString() : undefined

  try {
    // Check for duplicate entries to prevent favorites spam
    const existing = await db.favoriteVideo.findUnique({
      where: { videoId: sanitizedVideoId }
    })

    if (existing) {
      throw new ConflictError('Video already in favorites')
    }

    // Create new favorite with sanitized data
    const favorite = await db.favoriteVideo.create({
      data: {
        id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        videoId: sanitizedVideoId,
        title: title && title.trim() ? title.trim() : 'Unknown Video',
        channelName: channelName && channelName.trim() ? channelName.trim() : 'Unknown Channel',
        thumbnail: thumbnail && thumbnail.trim() ? thumbnail.trim() : '',
        duration: durationStr,
        viewCount: viewCountStr,
        updatedAt: new Date()
      }
    })

    // Format response data with ISO date strings
    const formattedFavorite = {
      ...favorite,
      addedAt: favorite.addedAt.toISOString(),
      updatedAt: favorite.updatedAt.toISOString()
    }

    return createSuccessResponse(context, formattedFavorite)
    
  } catch (error) {
    // Re-throw custom errors for proper HTTP status codes
    if (error instanceof ConflictError || error instanceof ValidationError) {
      throw error
    }
    
    // Handle database errors with detailed logging
    if (error instanceof Error) {
      throw new DatabaseError(`Failed to add favorite: ${error.message}`, {
        originalError: error.message,
        videoId: sanitizedVideoId
      })
    }
    
    throw error
  }
})

// ============================================================================
// REMOVE FAVORITE
// ============================================================================

/**
 * DELETE /api/favorites - Remove a favorite video
 * 
 * Removes a video from the user's favorites list by video ID.
 * Validates the request and handles errors appropriately.
 * 
 * @param request - Next.js request object with videoId in query params
 * @returns {Promise<NextResponse>} JSON response indicating success
 * 
 * Query Parameters:
 * - videoId (required): YouTube video ID to remove
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: null
 * }
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const context = createApiContext(request)
  const isIncognito = isIncognitoRequest(request)
  
  // Skip deleting favorites in incognito mode
  if (shouldSkipInIncognito(isIncognito)) {
    throw new AuthorizationError('Favorites are disabled in incognito mode')
  }
  
  // Extract video ID from query parameters
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  // Validate required parameter
  if (!videoId) {
    throw new ValidationError('Video ID is required')
  }

  // Validate and sanitize video ID
  const sanitizedVideoId = sanitizeVideoId(videoId)
  
  if (!sanitizedVideoId) {
    throw new ValidationError('Invalid video ID format', 'videoId')
  }

  try {
    // Check if favorite exists before attempting deletion
    const existing = await db.favoriteVideo.findUnique({
      where: { videoId: sanitizedVideoId }
    })

    if (!existing) {
      throw new ConflictError('Favorite not found')
    }

    // Delete the favorite from database
    await db.favoriteVideo.delete({
      where: { videoId: sanitizedVideoId }
    })

    return createSuccessResponse(context, null)
    
  } catch (error) {
    // Re-throw custom errors for proper HTTP status codes
    if (error instanceof ConflictError || error instanceof ValidationError) {
      throw error
    }
    
    // Handle database errors with detailed logging
    if (error instanceof Error) {
      throw new DatabaseError(`Failed to remove favorite: ${error.message}`, {
        originalError: error.message,
        videoId: sanitizedVideoId
      })
    }
    
    throw error
  }
})