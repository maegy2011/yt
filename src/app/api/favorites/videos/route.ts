import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const videos = await db.favoriteVideo.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(videos);
  } catch (error) {
    console.error('Get favorite videos error:', error);
    return NextResponse.json({ error: 'Failed to get favorite videos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, title, description, thumbnail, duration, viewCount, publishedAt, channelName, channelId } = body;

    if (!videoId || !title) {
      return NextResponse.json({ error: 'Video ID and title are required' }, { status: 400 });
    }

    const video = await db.favoriteVideo.create({
      data: {
        videoId,
        title,
        description,
        thumbnail,
        duration,
        viewCount,
        publishedAt,
        channelName,
        channelId,
        userId: 'default-user', // For demo purposes
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error('Add favorite video error:', error);
    return NextResponse.json({ error: 'Failed to add favorite video' }, { status: 500 });
  }
}