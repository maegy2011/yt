import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sanitizeVideoId, isValidYouTubeVideoId } from '@/lib/youtube-utils'
import { isIncognitoRequest, shouldSkipInIncognito, createIncognitoResponse } from '@/lib/incognito-utils'

export async function GET() {
  try {
    // Get database client
    const db = getDb()
    
    // Check if database is available
    if (!db) {
      console.error('Database connection not available')
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 })
    }
    
    const watchedVideos = await db.watchedVideo.findMany({
      orderBy: { watchedAt: 'desc' }
    })
    
    // Filter out any entries with invalid video IDs and convert dates to strings
    const validVideos = watchedVideos
      .filter(video => 
        video.videoId && isValidYouTubeVideoId(video.videoId)
      )
      .map(video => ({
        ...video,
        watchedAt: video.watchedAt.toISOString(),
        updatedAt: video.updatedAt.toISOString()
      }))
    
    // Clean up invalid entries from database
    const invalidVideos = watchedVideos.filter(video => 
      !video.videoId || !isValidYouTubeVideoId(video.videoId)
    )
    
    if (invalidVideos.length > 0) {
      console.log(`Cleaning up ${invalidVideos.length} invalid watched video entries`)
      await Promise.all(
        invalidVideos.map(video => 
          db.watchedVideo.delete({ where: { id: video.id } })
        )
      )
    }
    
    return NextResponse.json(validVideos)
  } catch (error) {
    console.error('Failed to fetch watched videos:', error)
    return NextResponse.json({ error: 'Failed to fetch watched videos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb()
    const isIncognito = isIncognitoRequest(request)
    
    // Skip saving watch history in incognito mode
    if (shouldSkipInIncognito(isIncognito)) {
      const body = await request.json()
      const { videoId, title, channelName, thumbnail, duration, viewCount } = body
      
      // Return success response but don't actually save
      const mockResponse = {
        id: 'incognito-' + Date.now(),
        videoId: sanitizeVideoId(videoId),
        title: title || 'Unknown Video',
        channelName: channelName || 'Unknown Channel',
        thumbnail: thumbnail || '',
        duration,
        viewCount: viewCount?.toString() || null,
        watchedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      return NextResponse.json(createIncognitoResponse(mockResponse, isIncognito))
    }
    
    const body = await request.json()
    const { videoId, title, channelName, thumbnail, duration, viewCount } = body

    // Validate and sanitize the video ID
    const sanitizedVideoId = sanitizeVideoId(videoId)
    
    if (!sanitizedVideoId) {
      console.error('Invalid video ID provided:', videoId)
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    // Check if video already exists
    const existing = await db.watchedVideo.findUnique({
      where: { videoId: sanitizedVideoId }
    })

    let watchedVideo
    if (existing) {
      // Update the existing record with latest data and timestamp
      watchedVideo = await db.watchedVideo.update({
        where: { videoId: sanitizedVideoId },
        data: {
          title: title || existing.title,
          channelName: channelName || existing.channelName,
          thumbnail: thumbnail || existing.thumbnail,
          duration: duration || existing.duration,
          viewCount: viewCount?.toString() || existing.viewCount,
          watchedAt: new Date(), // Update watchedAt to current time
          updatedAt: new Date()
        }
      })
    } else {
      // Create new record with validated data
      watchedVideo = await db.watchedVideo.create({
        data: {
          videoId: sanitizedVideoId,
          title: title || 'Unknown Video',
          channelName: channelName || 'Unknown Channel',
          thumbnail: thumbnail || '',
          duration,
          viewCount: viewCount?.toString() || null
        }
      })
    }

    // Convert dates to strings for the response
    const responseVideo = {
      ...watchedVideo,
      watchedAt: watchedVideo.watchedAt.toISOString(),
      updatedAt: watchedVideo.updatedAt.toISOString()
    }

    return NextResponse.json(responseVideo)
  } catch (error) {
    console.error('Failed to add watched video:', error)
    return NextResponse.json({ error: 'Failed to add watched video' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb()
    
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
    }

    await db.watchedVideo.delete({
      where: { videoId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete watched video' }, { status: 500 })
  }
}