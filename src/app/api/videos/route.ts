import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    let whereClause: any = {
      is_active: true
    }

    // Add search conditions if search term is provided
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase()
      whereClause = {
        AND: [
          { is_active: true },
          {
            OR: [
              {
                title: {
                  contains: searchTerm
                }
              },
              {
                description: {
                  contains: searchTerm
                }
              },
              {
                manual_tags: {
                  contains: searchTerm
                }
              }
            ]
          }
        ]
      }
    }

    const videos = await db.whitelistedVideo.findMany({
      where: whereClause,
      include: {
        channel: {
          select: {
            channel_title: true
          }
        },
        adder: {
          select: {
            email: true
          }
        }
      },
      orderBy: {
        added_at: 'desc'
      }
    })

    return NextResponse.json({
      videos: videos.map(video => ({
        id: video.id,
        video_id: video.video_id,
        title: video.title,
        description: video.description,
        thumbnails: video.thumbnails,
        duration: video.duration,
        manual_tags: video.manual_tags,
        is_active: video.is_active,
        channel_title: video.channel?.channel_title,
        added_at: video.added_at
      }))
    })
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}