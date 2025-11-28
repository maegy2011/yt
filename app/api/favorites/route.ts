import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeVideoId, isValidYouTubeVideoId } from '@/lib/youtube-utils'
import { isIncognitoRequest, shouldSkipInIncognito, createIncognitoResponse } from '@/lib/incognito-utils'
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

// GET /api/favorites - Get all favorite videos
export const GET = withErrorHandler(async (request: NextRequest) => {
  const context = createApiContext(request)
  
  // Check if database is available
  if (!db) {
    throw new DatabaseError('Database connection not available')
  }
  
  // Use optimized query with pagination
  const { result } = await optimizedQueries.getFavoriteVideos({
    limit: 100, // Reasonable default limit
    offset: 0
  })
  
  // Filter out any entries with invalid video IDs and convert dates to strings
  const validFavorites = result.videos
    .filter(favorite => 
      favorite.videoId && isValidYouTubeVideoId(favorite.videoId)
    )
    .map(favorite => ({
      ...favorite,
      addedAt: favorite.addedAt.toISOString(),
      updatedAt: favorite.updatedAt.toISOString()
    }))
  
  // Clean up invalid entries from database (async, don't wait)
  const invalidFavorites = result.videos.filter(favorite => 
    !favorite.videoId || !isValidYouTubeVideoId(favorite.videoId)
  )
  
  if (invalidFavorites.length > 0) {
    // Don't await this cleanup to avoid delaying the response
    Promise.all(
      invalidFavorites.map(favorite => 
        db.favoriteVideo.delete({ where: { id: favorite.id } })
      )
    ).catch(() => {
      // Cleanup errors are non-critical
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

// POST /api/favorites - Add a new favorite video
export const POST = withErrorHandler(async (request: NextRequest) => {
  const context = createApiContext(request)
  const isIncognito = isIncognitoRequest(request)
  
  // Skip saving favorites in incognito mode
  if (shouldSkipInIncognito(isIncognito)) {
    throw new AuthorizationError('Favorites are disabled in incognito mode')
  }
  
  let body: any
  try {
    body = await request.json()
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body')
  }
  
  const { videoId, title, channelName, thumbnail, duration, viewCount } = body

  // Validate required fields
  if (!videoId) {
    throw new ValidationError('Video ID is required', { field: 'videoId' })
  }

  // Validate and sanitize video ID
  const sanitizedVideoId = sanitizeVideoId(videoId)
  
  if (!sanitizedVideoId) {
    throw new ValidationError('Invalid video ID format', { 
      field: 'videoId',
      providedValue: videoId 
    })
  }

  // Validate optional string fields
  const stringFields = [
    { name: 'title', value: title },
    { name: 'channelName', value: channelName },
    { name: 'thumbnail', value: thumbnail }
  ]
  
  for (const field of stringFields) {
    if (field.value !== undefined && typeof field.value !== 'string') {
      throw new ValidationError(`${field.name} must be a string`, { 
        field: field.name,
        receivedType: typeof field.value 
      })
    }
  }
  
  // Validate viewCount (allow string formats like "1.4B", "1.5M", etc.)
  if (viewCount !== undefined && typeof viewCount !== 'string' && typeof viewCount !== 'number') {
    throw new ValidationError('View count must be a string or number', { 
      field: 'viewCount',
      receivedType: typeof viewCount 
    })
  }

  // Convert duration and viewCount to strings for database
  const durationStr = duration ? duration.toString() : undefined
  const viewCountStr = viewCount ? viewCount.toString() : undefined

  try {
    // Check if video already exists
    const existing = await db.favoriteVideo.findUnique({
      where: { videoId: sanitizedVideoId }
    })

    if (existing) {
      throw new ConflictError('Video already in favorites', { 
        videoId: sanitizedVideoId,
        existingId: existing.id 
      })
    }

    // Create new favorite
    const favorite = await db.favoriteVideo.create({
      data: {
        videoId: sanitizedVideoId,
        title: title && title.trim() ? title.trim() : 'Unknown Video',
        channelName: channelName && channelName.trim() ? channelName.trim() : 'Unknown Channel',
        thumbnail: thumbnail && thumbnail.trim() ? thumbnail.trim() : '',
        duration: durationStr,
        viewCount: viewCountStr
      }
    })

    // Convert Date objects to strings for JSON serialization
    const formattedFavorite = {
      ...favorite,
      addedAt: favorite.addedAt.toISOString(),
      updatedAt: favorite.updatedAt.toISOString()
    }

    return createSuccessResponse(context, formattedFavorite)
    
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof ConflictError || error instanceof ValidationError) {
      throw error
    }
    
    // Handle database errors
    if (error instanceof Error) {
      throw new DatabaseError(`Failed to add favorite: ${error.message}`, {
        originalError: error.message,
        videoId: sanitizedVideoId
      })
    }
    
    throw error
  }
})

// DELETE /api/favorites - Remove a favorite video by video ID
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const context = createApiContext(request)
  const isIncognito = isIncognitoRequest(request)
  
  // Skip deleting favorites in incognito mode
  if (shouldSkipInIncognito(isIncognito)) {
    throw new AuthorizationError('Favorites are disabled in incognito mode')
  }
  
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  // Validate required parameter
  if (!videoId) {
    throw new ValidationError('Video ID is required', { field: 'videoId' })
  }

  // Validate and sanitize video ID
  const sanitizedVideoId = sanitizeVideoId(videoId)
  
  if (!sanitizedVideoId) {
    throw new ValidationError('Invalid video ID format', { 
      field: 'videoId',
      providedValue: videoId 
    })
  }

  try {
    // Check if favorite exists
    const existing = await db.favoriteVideo.findUnique({
      where: { videoId: sanitizedVideoId }
    })

    if (!existing) {
      throw new ConflictError('Favorite not found', { 
        videoId: sanitizedVideoId
      })
    }

    // Delete the favorite
    await db.favoriteVideo.delete({
      where: { videoId: sanitizedVideoId }
    })

    return createSuccessResponse(context, null, {
      message: 'Video removed from favorites successfully'
    })
    
  } catch (error) {
    // Re-throw our custom errors
    if (error instanceof ConflictError || error instanceof ValidationError) {
      throw error
    }
    
    // Handle database errors
    if (error instanceof Error) {
      throw new DatabaseError(`Failed to remove favorite: ${error.message}`, {
        originalError: error.message,
        videoId: sanitizedVideoId
      })
    }
    
    throw error
  }
})