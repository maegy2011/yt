import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeVideoId, isValidYouTubeVideoId } from '@/lib/youtube-utils'

export async function GET() {
  try {
    // Check if database is available
    if (!db) {
      console.error('Database connection not available')
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }
    
    const favorites = await db.favoriteVideo.findMany({
      orderBy: { addedAt: 'desc' }
    })
    
    // Filter out any entries with invalid video IDs
    const validFavorites = favorites.filter(favorite => 
      favorite.videoId && isValidYouTubeVideoId(favorite.videoId)
    )
    
    // Clean up invalid entries from database
    const invalidFavorites = favorites.filter(favorite => 
      !favorite.videoId || !isValidYouTubeVideoId(favorite.videoId)
    )
    
    if (invalidFavorites.length > 0) {
      console.log(`Cleaning up ${invalidFavorites.length} invalid favorite entries`)
      await Promise.all(
        invalidFavorites.map(favorite => 
          db.favoriteVideo.delete({ where: { id: favorite.id } })
        )
      )
    }
    
    return NextResponse.json(validFavorites)
  } catch (error) {
    console.error('Failed to fetch favorites:', error)
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoId, title, channelName, thumbnail, duration, viewCount } = body

    // Validate required fields
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    // Validate and sanitize the video ID
    const sanitizedVideoId = sanitizeVideoId(videoId)
    
    if (!sanitizedVideoId) {
      console.error('Invalid video ID provided:', videoId)
      return NextResponse.json({ error: 'Invalid video ID format' }, { status: 400 })
    }

    // Validate optional string fields
    if (title && typeof title !== 'string') {
      return NextResponse.json({ error: 'Title must be a string' }, { status: 400 })
    }
    
    if (channelName && typeof channelName !== 'string') {
      return NextResponse.json({ error: 'Channel name must be a string' }, { status: 400 })
    }
    
    if (thumbnail && typeof thumbnail !== 'string') {
      return NextResponse.json({ error: 'Thumbnail must be a string' }, { status: 400 })
    }

    // Validate numeric fields
    if (viewCount !== undefined && (typeof viewCount !== 'number' || viewCount < 0)) {
      return NextResponse.json({ error: 'View count must be a non-negative number' }, { status: 400 })
    }

    try {
      const existing = await db.favoriteVideo.findUnique({
        where: { videoId: sanitizedVideoId }
      })

      if (existing) {
        return NextResponse.json({ error: 'Video already in favorites' }, { status: 409 })
      }

      const favorite = await db.favoriteVideo.create({
        data: {
          videoId: sanitizedVideoId,
          title: title && title.trim() ? title.trim() : 'Unknown Video',
          channelName: channelName && channelName.trim() ? channelName.trim() : 'Unknown Channel',
          thumbnail: thumbnail && thumbnail.trim() ? thumbnail.trim() : '',
          duration,
          viewCount
        }
      })

      return NextResponse.json(favorite)
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to add favorite:', error)
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}