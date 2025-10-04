import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const decoded = requireAdmin(request);

    const { videoId, title, description, thumbnails, duration, channelId, manualTags } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Check if video already exists
    const existingVideo = await db.whitelistedVideo.findUnique({
      where: { videoId }
    });

    if (existingVideo) {
      return NextResponse.json(
        { error: 'Video already exists in whitelist' },
        { status: 409 }
      );
    }

    // Create new video
    const video = await db.whitelistedVideo.create({
      data: {
        videoId,
        title,
        description,
        thumbnails,
        duration,
        channelId,
        addedBy: decoded.userId,
        manualTags: manualTags || [],
      },
      include: {
        channel: {
          select: {
            id: true,
            channelId: true,
            channelTitle: true,
          },
        },
        addedByUser: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'ADD_VIDEO',
        targetType: 'VIDEO',
        targetId: videoId,
        details: {
          title,
          channelId,
        },
      },
    });

    return NextResponse.json({
      message: 'Video added successfully',
      video,
    });
  } catch (error) {
    console.error('Error adding video:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}