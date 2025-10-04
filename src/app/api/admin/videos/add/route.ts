import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { db } from '@/lib/db'
import { youtubeAPI } from '@/lib/youtube'

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const admin = await requireAdmin()

    const { videoUrl, tags } = await request.json()

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      )
    }

    // Extract video ID from URL
    const videoId = youtubeAPI.extractVideoId(videoUrl)
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube video URL' },
        { status: 400 }
      )
    }

    // Check if video already exists
    const existingVideo = await db.whitelistedVideo.findUnique({
      where: { video_id: videoId }
    })

    if (existingVideo) {
      return NextResponse.json(
        { error: 'Video already exists in whitelist' },
        { status: 400 }
      )
    }

    // Fetch video metadata from YouTube API
    const videoData = await youtubeAPI.getVideo(videoId)

    // Check if channel exists, if not create it
    let channel = await db.whitelistedChannel.findUnique({
      where: { channel_id: videoData.channelId }
    })

    if (!channel) {
      // Create new channel
      channel = await db.whitelistedChannel.create({
        data: {
          channel_id: videoData.channelId,
          channel_title: videoData.channelTitle,
          added_by: admin.id
        }
      })

      // Log channel creation
      await db.auditLog.create({
        data: {
          user_id: admin.id,
          action: 'create_channel',
          target_type: 'channel',
          target_id: channel.id,
          details: { 
            channel_id: videoData.channelId,
            channel_title: videoData.channelTitle
          }
        }
      })
    }

    // Create the video
    const video = await db.whitelistedVideo.create({
      data: {
        video_id: videoId,
        title: videoData.title,
        description: videoData.description,
        thumbnails: videoData.thumbnails,
        duration: videoData.duration,
        channel_id: videoData.channelId,
        added_by: admin.id,
        manual_tags: tags || ''
      }
    })

    // Log quota usage (1 unit per video fetch)
    await db.apiQuotaLog.create({
      data: {
        date: new Date(),
        used_units: 1,
        remaining_units: null // Will be calculated by the system
      }
    })

    // Log video creation
    await db.auditLog.create({
      data: {
        user_id: admin.id,
        action: 'add_video',
        target_type: 'video',
        target_id: video.id,
        details: { 
          video_id: videoId,
          title: videoData.title,
          channel_title: videoData.channelTitle
        }
      }
    })

    return NextResponse.json({
      message: 'Video added successfully',
      video: {
        id: video.id,
        video_id: video.video_id,
        title: video.title,
        channel_title: videoData.channelTitle,
        duration: video.duration,
        thumbnails: video.thumbnails
      }
    })
  } catch (error) {
    console.error('Error adding video:', error)
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    if (error instanceof Error && error.message.includes('YouTube API Error')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add video' },
      { status: 500 }
    )
  }
}