import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeVideoId, isValidYouTubeVideoId } from '@/lib/youtube-utils'

// Debug logging utility for API routes
const debugLog = (route: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [API:${route}] ${action}`, data ? data : '')
}

const debugError = (route: string, action: string, error: any) => {
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] [API:${route}] ERROR in ${action}:`, error)
}

const debugWarn = (route: string, action: string, warning: any) => {
  const timestamp = new Date().toISOString()
  console.warn(`[${timestamp}] [API:${route}] WARNING in ${action}:`, warning)
}

export async function GET() {
  debugLog('Favorites', 'GET request received')
  
  try {
    // Check if database is available
    if (!db) {
      debugError('Favorites', 'Database connection not available')
      console.error('Database connection not available')
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }
    
    debugLog('Favorites', 'Fetching favorites from database')
    const favorites = await db.favoriteVideo.findMany({
      orderBy: { addedAt: 'desc' }
    })
    
    debugLog('Favorites', 'Fetched favorites', { count: favorites.length })
    
    // Filter out any entries with invalid video IDs
    const validFavorites = favorites.filter(favorite => 
      favorite.videoId && isValidYouTubeVideoId(favorite.videoId)
    )
    
    // Clean up invalid entries from database
    const invalidFavorites = favorites.filter(favorite => 
      !favorite.videoId || !isValidYouTubeVideoId(favorite.videoId)
    )
    
    if (invalidFavorites.length > 0) {
      debugLog('Favorites', 'Cleaning up invalid entries', { count: invalidFavorites.length })
      console.log(`Cleaning up ${invalidFavorites.length} invalid favorite entries`)
      await Promise.all(
        invalidFavorites.map(favorite => 
          db.favoriteVideo.delete({ where: { id: favorite.id } })
        )
      )
      debugLog('Favorites', 'Invalid entries cleaned up successfully')
    }
    
    debugLog('Favorites', 'Returning valid favorites', { count: validFavorites.length })
    return NextResponse.json(validFavorites)
  } catch (error) {
    debugError('Favorites', 'Failed to fetch favorites', error)
    console.error('Failed to fetch favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  debugLog('Favorites', 'POST request received')
  
  try {
    const body = await request.json()
    const { videoId, title, channelName, thumbnail, duration, viewCount } = body

    debugLog('Favorites', 'Request body parsed', { 
      videoId, 
      title: title?.substring(0, 50) + '...', 
      channelName: channelName?.substring(0, 30) + '...',
      hasThumbnail: !!thumbnail,
      duration,
      viewCount
    })

    // Validate required fields
    if (!videoId) {
      debugWarn('Favorites', 'Missing video ID in request')
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // Validate and sanitize the video ID
    const sanitizedVideoId = sanitizeVideoId(videoId)
    
    if (!sanitizedVideoId) {
      debugError('Favorites', 'Invalid video ID provided', { originalVideoId: videoId })
      console.error('Invalid video ID provided:', videoId)
      return NextResponse.json({ error: 'Invalid video ID format' }, { status: 400 })
    }

    debugLog('Favorites', 'Video ID sanitized', { original: videoId, sanitized: sanitizedVideoId })

    // Validate optional string fields
    if (title && typeof title !== 'string') {
      debugWarn('Favorites', 'Invalid title type', { type: typeof title })
      return NextResponse.json({ error: 'Title must be a string' }, { status: 400 })
    }
    
    if (channelName && typeof channelName !== 'string') {
      debugWarn('Favorites', 'Invalid channelName type', { type: typeof channelName })
      return NextResponse.json({ error: 'Channel name must be a string' }, { status: 400 })
    }
    
    if (thumbnail && typeof thumbnail !== 'string') {
      debugWarn('Favorites', 'Invalid thumbnail type', { type: typeof thumbnail })
      return NextResponse.json({ error: 'Thumbnail must be a string' }, { status: 400 })
    }

    // Validate viewCount (allow string formats like "1.4B", "1.5M", etc.)
    if (viewCount !== undefined && typeof viewCount !== 'string' && typeof viewCount !== 'number') {
      debugError('Favorites', 'Invalid viewCount type', { type: typeof viewCount, value: viewCount })
      console.error('Invalid viewCount type:', typeof viewCount, viewCount)
      return NextResponse.json({ error: 'View count must be a string or number' }, { status: 400 })
    }

    // Convert duration and viewCount to strings for database
    const durationStr = duration ? duration.toString() : undefined
    const viewCountStr = viewCount ? viewCount.toString() : undefined

    try {
      debugLog('Favorites', 'Checking if video already exists', { videoId: sanitizedVideoId })
      console.log('Adding favorite with videoId:', sanitizedVideoId)
      const existing = await db.favoriteVideo.findUnique({
        where: { videoId: sanitizedVideoId }
      })

      if (existing) {
        debugLog('Favorites', 'Video already exists in favorites', { videoId: sanitizedVideoId, title: existing.title })
        console.log('Video already exists:', existing)
        return NextResponse.json({ error: 'Video already in favorites' }, { status: 409 })
      }

      debugLog('Favorites', 'Creating new favorite entry')
      console.log('Creating new favorite entry...')
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

      debugLog('Favorites', 'Favorite created successfully', { 
        id: favorite.id, 
        videoId: favorite.videoId, 
        title: favorite.title 
      })
      console.log('Favorite created successfully:', favorite)
      return NextResponse.json(favorite)
    } catch (dbError) {
      debugError('Favorites', 'Database operation failed', dbError)
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
    }
  } catch (error) {
    debugError('Favorites', 'Failed to add favorite', error)
    console.error('Failed to add favorite:', error)
    
    if (error instanceof SyntaxError) {
      debugWarn('Favorites', 'Invalid JSON in request body')
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}