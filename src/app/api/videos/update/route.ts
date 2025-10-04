import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const decoded = requireAdmin(request);

    const { videoId, title, description, thumbnails, duration, channelId, isActive, manualTags } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Check if video exists
    const existingVideo = await db.whitelistedVideo.findUnique({
      where: { videoId }
    });

    if (!existingVideo) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Update video
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnails !== undefined) updateData.thumbnails = thumbnails;
    if (duration !== undefined) updateData.duration = duration;
    if (channelId !== undefined) updateData.channelId = channelId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (manualTags !== undefined) updateData.manualTags = manualTags;
    updateData.lastFetched = new Date();

    const video = await db.whitelistedVideo.update({
      where: { videoId },
      data: updateData,
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
        action: 'UPDATE_VIDEO',
        targetType: 'VIDEO',
        targetId: videoId,
        details: {
          updatedFields: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json({
      message: 'Video updated successfully',
      video,
    });
  } catch (error) {
    console.error('Error updating video:', error);
    
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