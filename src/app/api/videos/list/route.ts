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
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const channelId = searchParams.get('channelId') || '';
    const isActive = searchParams.get('isActive') !== 'false';
    const tags = searchParams.get('tags') || '';

    const skip = (page - 1) * limit;

    // Build where clause with enhanced search
    const where: any = {
      isActive,
    };

    if (search) {
      // Use PostgreSQL full-text search if available, otherwise fallback to contains
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        // Search in manual tags if they exist and are stored as JSON
        {
          manualTags: {
            path: '$',
            array_contains: [search],
          },
        },
      ];
    }

    if (channelId) {
      where.channelId = channelId;
    }

    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim());
      where.manualTags = {
        path: '$',
        array_contains: tagList,
      };
    }

    // Get videos with pagination
    const [videos, total] = await Promise.all([
      db.whitelistedVideo.findMany({
        where,
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
        orderBy: [
          { addedAt: 'desc' },
          { title: 'asc' }
        ],
        skip,
        take: limit,
      }),
      db.whitelistedVideo.count({ where }),
    ]);

    // If search is provided, also search in manual tags
    let searchResults = videos;
    if (search) {
      const searchLower = search.toLowerCase();
      searchResults = videos.filter(video => {
        const manualTags = Array.isArray(video.manualTags) ? video.manualTags : [];
        return manualTags.some(tag => 
          typeof tag === 'string' && tag.toLowerCase().includes(searchLower)
        );
      });
    }

    return NextResponse.json({
      videos: searchResults,
      pagination: {
        page,
        limit,
        total: search ? searchResults.length : total,
        pages: Math.ceil((search ? searchResults.length : total) / limit),
      },
      searchInfo: {
        query: search,
        foundResults: searchResults.length,
        totalResults: total,
      },
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}