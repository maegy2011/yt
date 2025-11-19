import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sanitizeVideoId, isValidYouTubeVideoId } from '@/lib/youtube-utils'

// GET /api/playback-position?videoId=xxx - Get playback position for a specific video
export async function GET(request: NextRequest) {
  console.log('🎯 [PLAYBACK-POSITION-API] GET request received')
  
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    console.log('📺 [PLAYBACK-POSITION-API] Request params:', { videoId })

    if (!videoId) {
      console.log('❌ [PLAYBACK-POSITION-API] No videoId provided')
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
    }

    // Validate and sanitize video ID
    const sanitizedVideoId = sanitizeVideoId(videoId)
    console.log('🔧 [PLAYBACK-POSITION-API] Sanitized videoId:', { original: videoId, sanitized: sanitizedVideoId })
    
    if (!sanitizedVideoId) {
      console.log('❌ [PLAYBACK-POSITION-API] Invalid videoId:', videoId)
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    // Check if database is available
    if (!db) {
      console.log('❌ [PLAYBACK-POSITION-API] Database not available')
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }

    console.log('🔍 [PLAYBACK-POSITION-API] Querying database for videoId:', sanitizedVideoId)
    const watchedVideo = await db.watchedVideo.findUnique({
      where: { videoId: sanitizedVideoId }
    })

    if (!watchedVideo) {
      console.log('📝 [PLAYBACK-POSITION-API] No existing record found for video:', sanitizedVideoId)
      return NextResponse.json({ 
        currentPosition: 0, 
        exists: false,
        videoId: sanitizedVideoId 
      })
    }

    const response = {
      currentPosition: watchedVideo.currentPosition || 0,
      lastWatchedAt: watchedVideo.lastWatchedAt,
      exists: true,
      videoId: sanitizedVideoId,
      title: watchedVideo.title,
      duration: watchedVideo.duration
    }

    console.log('✅ [PLAYBACK-POSITION-API] Successfully retrieved position:', response)
    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 [PLAYBACK-POSITION-API] GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch playback position' }, { status: 500 })
  }
}

// POST /api/playback-position - Update or create playback position
export async function POST(request: NextRequest) {
  console.log('📝 [PLAYBACK-POSITION-API] POST request received')
  
  try {
    const body = await request.json()
    const { 
      videoId, 
      title, 
      channelName, 
      thumbnail, 
      duration, 
      viewCount,
      currentPosition,
      lastWatchedAt 
    } = body

    console.log('📊 [PLAYBACK-POSITION-API] Request body:', {
      videoId,
      title: title?.substring(0, 50) + (title?.length > 50 ? '...' : ''),
      channelName,
      currentPosition,
      lastWatchedAt
    })

    // Validate and sanitize video ID
    const sanitizedVideoId = sanitizeVideoId(videoId)
    console.log('🔧 [PLAYBACK-POSITION-API] Sanitized videoId:', { original: videoId, sanitized: sanitizedVideoId })
    
    if (!sanitizedVideoId) {
      console.log('❌ [PLAYBACK-POSITION-API] Invalid video ID provided:', videoId)
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    // Validate current position
    if (typeof currentPosition !== 'number' || currentPosition < 0) {
      console.log('❌ [PLAYBACK-POSITION-API] Invalid current position:', currentPosition)
      return NextResponse.json({ error: 'Invalid current position' }, { status: 400 })
    }

    // Check if database is available
    if (!db) {
      console.log('❌ [PLAYBACK-POSITION-API] Database connection not available')
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }

    console.log('🔍 [PLAYBACK-POSITION-API] Checking for existing record:', sanitizedVideoId)
    // Check if video already exists
    const existing = await db.watchedVideo.findUnique({
      where: { videoId: sanitizedVideoId }
    })

    let watchedVideo
    if (existing) {
      console.log('🔄 [PLAYBACK-POSITION-API] Updating existing record:', {
        videoId: sanitizedVideoId,
        oldPosition: existing.currentPosition,
        newPosition: currentPosition,
        lastWatchedAt: existing.lastWatchedAt
      })
      
      // Update existing record with new playback position
      watchedVideo = await db.watchedVideo.update({
        where: { videoId: sanitizedVideoId },
        data: {
          title: title || existing.title,
          channelName: channelName || existing.channelName,
          thumbnail: thumbnail || existing.thumbnail,
          duration: duration || existing.duration,
          viewCount: viewCount || existing.viewCount,
          currentPosition: currentPosition,
          lastWatchedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date(),
          updatedAt: new Date()
        }
      })
    } else {
      console.log('➕ [PLAYBACK-POSITION-API] Creating new record:', {
        videoId: sanitizedVideoId,
        title: title?.substring(0, 50),
        currentPosition,
        lastWatchedAt
      })
      
      // Create new record with playback position
      watchedVideo = await db.watchedVideo.create({
        data: {
          videoId: sanitizedVideoId,
          title: title || 'Unknown Video',
          channelName: channelName || 'Unknown Channel',
          thumbnail: thumbnail || '',
          duration,
          viewCount,
          currentPosition: currentPosition,
          lastWatchedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date()
        }
      })
    }

    console.log('✅ [PLAYBACK-POSITION-API] Successfully saved position:', {
      videoId: sanitizedVideoId,
      currentPosition: watchedVideo.currentPosition,
      lastWatchedAt: watchedVideo.lastWatchedAt,
      updatedAt: watchedVideo.updatedAt
    })

    return NextResponse.json(watchedVideo)
  } catch (error) {
    console.error('💥 [PLAYBACK-POSITION-API] POST Error:', error)
    return NextResponse.json({ error: 'Failed to update playback position' }, { status: 500 })
  }
}

// PUT /api/playback-position - Bulk update multiple playback positions
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { positions } = body

    if (!Array.isArray(positions)) {
      return NextResponse.json({ error: 'Positions array required' }, { status: 400 })
    }

    // Check if database is available
    if (!db) {
      console.error('Database connection not available')
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }

    const results = await Promise.allSettled(
      positions.map(async (position: any) => {
        const { videoId, currentPosition, lastWatchedAt } = position
        
        // Validate and sanitize video ID
        const sanitizedVideoId = sanitizeVideoId(videoId)
        
        if (!sanitizedVideoId || typeof currentPosition !== 'number' || currentPosition < 0) {
          throw new Error(`Invalid data for video ${videoId}`)
        }

        // Update or create the record
        return await db.watchedVideo.upsert({
          where: { videoId: sanitizedVideoId },
          update: {
            currentPosition: currentPosition,
            lastWatchedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date(),
            updatedAt: new Date()
          },
          create: {
            videoId: sanitizedVideoId,
            title: position.title || 'Unknown Video',
            channelName: position.channelName || 'Unknown Channel',
            thumbnail: position.thumbnail || '',
            duration: position.duration,
            viewCount: position.viewCount,
            currentPosition: currentPosition,
            lastWatchedAt: lastWatchedAt ? new Date(lastWatchedAt) : new Date()
          }
        })
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      message: `Updated ${successful} positions${failed > 0 ? `, ${failed} failed` : ''}`,
      successful,
      failed
    })

  } catch (error) {
    console.error('Failed to bulk update playback positions:', error)
    return NextResponse.json({ error: 'Failed to bulk update playback positions' }, { status: 500 })
  }
}