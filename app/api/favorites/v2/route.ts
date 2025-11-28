import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { routeMiddleware, withValidation } from '@/lib/api/wrapper'
import { validationMiddleware, commonSchemas } from '@/lib/api/validation'
import { isIncognitoRequest, shouldSkipInIncognito } from '@/lib/incognito-utils'

// GET handler with middleware
const getHandler = routeMiddleware.authenticated(async (request: NextRequest, context: any) => {
  try {
    // Check if database is available
    if (!db) {
      return await import('@/lib/api/middleware').then(m => 
        m.createErrorResponse(context, 'DATABASE_ERROR', 'Database connection not available', 500)
      )
    }
    
    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    
    // Build database query
    const whereClause: any = {}
    
    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { channelName: { contains: search } }
      ]
    }
    
    // Get favorites with pagination
    const [favorites, totalCount] = await Promise.all([
      db.favoriteVideo.findMany({
        where: whereClause,
        orderBy: { addedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      db.favoriteVideo.count({ where: whereClause })
    ])
    
    // Filter out any entries with invalid video IDs and convert dates to strings
    const validFavorites = favorites
      .filter(favorite => 
        favorite.videoId && /^[a-zA-Z0-9_-]{8,20}$/.test(favorite.videoId)
      )
      .map(favorite => ({
        id: favorite.id,
        videoId: favorite.videoId,
        title: favorite.title,
        channelName: favorite.channelName,
        thumbnail: favorite.thumbnail,
        duration: favorite.duration,
        viewCount: favorite.viewCount,
        addedAt: favorite.addedAt.toISOString(),
        updatedAt: favorite.updatedAt.toISOString()
      }))
    
    // Clean up invalid entries from database
    const invalidFavorites = favorites.filter(favorite => 
      !favorite.videoId || !/^[a-zA-Z0-9_-]{8,20}$/.test(favorite.videoId)
    )
    
    if (invalidFavorites.length > 0) {
      await Promise.all(
        invalidFavorites.map(favorite => 
          db.favoriteVideo.delete({ where: { id: favorite.id } })
        )
      )
    }
    
    // Return paginated response
    return await import('@/lib/api/middleware').then(m => 
      m.createSuccessResponse(context, validFavorites, {
        pagination: {
          page,
          limit,
          total: totalCount,
          hasMore: page * limit < totalCount
        }
      })
    )
    
  } catch (error) {
    return await import('@/lib/api/middleware').then(m => 
      m.createErrorResponse(context, 'FETCH_ERROR', 'Failed to fetch favorites', 500, error)
    )
  }
})

// POST handler with validation
const postHandler = withValidation(
  commonSchemas.favoriteVideo,
  async (request: NextRequest, context: any) => {
    const validatedData = await validationMiddleware(commonSchemas.favoriteVideo)(request, context)
    const isIncognito = isIncognitoRequest(request)
    
    // Skip saving favorites in incognito mode
    if (shouldSkipInIncognito(isIncognito)) {
      return await import('@/lib/api/middleware').then(m => 
        m.createErrorResponse(context, 'INCOGNITO_MODE', 'Favorites are disabled in incognito mode', 403)
      )
    }
    
    try {
      const { videoId, title, channelName, thumbnail, duration, viewCount } = validatedData
      
      // Check if favorite already exists
      const existing = await db.favoriteVideo.findUnique({
        where: { videoId }
      })

      if (existing) {
        return await import('@/lib/api/middleware').then(m => 
          m.createErrorResponse(context, 'ALREADY_EXISTS', 'Video already in favorites', 409)
        )
      }

      // Create new favorite
      const favorite = await db.favoriteVideo.create({
        data: {
          videoId,
          title: title.trim() || 'Unknown Video',
          channelName: channelName.trim() || 'Unknown Channel',
          thumbnail: thumbnail?.trim() || '',
          duration: duration ? duration.toString() : undefined,
          viewCount: viewCount ? viewCount.toString() : undefined
        }
      })

      // Format response
      const formattedFavorite = {
        id: favorite.id,
        videoId: favorite.videoId,
        title: favorite.title,
        channelName: favorite.channelName,
        thumbnail: favorite.thumbnail,
        duration: favorite.duration,
        viewCount: favorite.viewCount,
        addedAt: favorite.addedAt.toISOString(),
        updatedAt: favorite.updatedAt.toISOString()
      }

      return await import('@/lib/api/middleware').then(m => 
        m.createSuccessResponse(context, formattedFavorite)
      )
      
    } catch (dbError) {
      return await import('@/lib/api/middleware').then(m => 
        m.createErrorResponse(context, 'DATABASE_ERROR', 'Database operation failed', 500, dbError)
      )
    }
  }
)

// Export the handlers
export async function GET(request: NextRequest) {
  return getHandler(request)
}

export async function POST(request: NextRequest) {
  return postHandler(request)
}