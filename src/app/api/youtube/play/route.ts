import { NextRequest, NextResponse } from 'next/server'
import { extractVideoIdFromUrl, isValidYouTubeVideoId } from '@/lib/youtube-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ 
        error: 'YouTube URL is required' 
      }, { status: 400 })
    }

    // Extract video ID from URL
    const videoId = extractVideoIdFromUrl(url)

    if (!videoId) {
      return NextResponse.json({ 
        error: 'Invalid YouTube URL. Please provide a valid YouTube video URL.' 
      }, { status: 400 })
    }

    // Validate video ID
    if (!isValidYouTubeVideoId(videoId)) {
      return NextResponse.json({ 
        error: 'Invalid YouTube video ID' 
      }, { status: 400 })
    }

    // Get video details using existing API
    try {
      const videoResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/youtube/video/${videoId}`)
      
      if (!videoResponse.ok) {
        // If video not found, still return the video ID so the player can attempt to play it
        return NextResponse.json({
          success: true,
          videoId,
          title: 'Unknown Video',
          channelName: 'Unknown Channel',
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          duration: null,
          viewCount: null,
          publishedAt: null,
          isLive: false,
          description: '',
          warning: 'Video details could not be retrieved, but you can still try to play it.'
        })
      }

      const videoData = await videoResponse.json()
      
      return NextResponse.json({
        success: true,
        videoId,
        ...videoData
      })
    } catch (error) {
      console.error('Error fetching video details:', error)
      
      // Return basic info even if details fetch fails
      return NextResponse.json({
        success: true,
        videoId,
        title: 'Unknown Video',
        channelName: 'Unknown Channel',
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        duration: null,
        viewCount: null,
        publishedAt: null,
        isLive: false,
        description: '',
        warning: 'Video details could not be retrieved, but you can still try to play it.'
      })
    }
  } catch (error) {
    console.error('Error processing YouTube URL:', error)
    return NextResponse.json({ 
      error: 'Failed to process YouTube URL' 
    }, { status: 500 })
  }
}

// Check if clipboard contains YouTube video URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const checkClipboard = searchParams.get('checkClipboard') === 'true'

    if (!checkClipboard) {
      return NextResponse.json({ 
        error: 'checkClipboard parameter must be true' 
      }, { status: 400 })
    }

    // Note: This endpoint can't actually access clipboard from the server
    // This is just a placeholder - the actual clipboard checking should be done client-side
    return NextResponse.json({
      success: true,
      message: 'Clipboard checking should be performed client-side',
      clientSideFunction: 'checkClipboardForYouTubeVideo'
    })
  } catch (error) {
    console.error('Error checking clipboard:', error)
    return NextResponse.json({ 
      error: 'Failed to check clipboard' 
    }, { status: 500 })
  }
}