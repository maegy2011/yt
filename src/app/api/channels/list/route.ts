import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { channelTitle: { contains: search, mode: 'insensitive' } },
        { channelId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get channels with pagination
    const [channels, total] = await Promise.all([
      db.whitelistedChannel.findMany({
        where,
        include: {
          addedByUser: {
            select: {
              id: true,
              email: true,
            },
          },
          _count: {
            select: {
              videos: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: { addedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.whitelistedChannel.count({ where }),
    ]);

    return NextResponse.json({
      channels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}