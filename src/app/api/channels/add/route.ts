import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const decoded = requireAdmin(request);

    const { channelId, channelTitle } = await request.json();

    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      );
    }

    // Check if channel already exists
    const existingChannel = await db.whitelistedChannel.findUnique({
      where: { channelId }
    });

    if (existingChannel) {
      return NextResponse.json(
        { error: 'Channel already exists in whitelist' },
        { status: 409 }
      );
    }

    // Create new channel
    const channel = await db.whitelistedChannel.create({
      data: {
        channelId,
        channelTitle,
        addedBy: decoded.userId,
      },
      include: {
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
        action: 'ADD_CHANNEL',
        targetType: 'CHANNEL',
        targetId: channelId,
        details: {
          channelTitle,
        },
      },
    });

    return NextResponse.json({
      message: 'Channel added successfully',
      channel,
    });
  } catch (error) {
    console.error('Error adding channel:', error);
    
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