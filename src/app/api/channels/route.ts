import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const channels = await db.whitelistedChannel.findMany({
      include: {
        videos: {
          where: {
            is_active: true
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        added_at: 'desc'
      }
    })

    return NextResponse.json({
      channels: channels.map(channel => ({
        id: channel.id,
        channel_id: channel.channel_id,
        channel_title: channel.channel_title || 'Unknown Channel',
        video_count: channel.videos.length,
        thumbnail_url: null // Could be enhanced to fetch channel thumbnails
      }))
    })
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    )
  }
}