import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const decoded = requireAdmin(request);

    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: 'YouTube API key not configured' },
        { status: 500 }
      );
    }

    // Fetch video data from YouTube API
    const videoResponse = await fetch(
      `${YOUTUBE_API_URL}/videos?id=${videoId}&part=snippet,contentDetails,statistics&key=${YOUTUBE_API_KEY}`
    );

    if (!videoResponse.ok) {
      const errorData = await videoResponse.json();
      return NextResponse.json(
        { error: 'Failed to fetch video from YouTube', details: errorData },
        { status: videoResponse.status }
      );
    }

    const videoData = await videoResponse.json();

    if (!videoData.items || videoData.items.length === 0) {
      return NextResponse.json(
        { error: 'Video not found on YouTube' },
        { status: 404 }
      );
    }

    const videoInfo = videoData.items[0];
    const snippet = videoInfo.snippet;
    const contentDetails = videoInfo.contentDetails;
    const statistics = videoInfo.statistics;

    // Extract video details
    const videoDetails = {
      videoId,
      title: snippet.title,
      description: snippet.description,
      thumbnails: snippet.thumbnails,
      duration: contentDetails.duration,
      channelId: snippet.channelId,
      channelTitle: snippet.channelTitle,
      viewCount: statistics.viewCount,
      likeCount: statistics.likeCount,
    };

    // Log API quota usage (assuming 1 unit per video request)
    const quotaUsed = 1;
    
    // Get current quota settings
    const quotaSetting = await db.setting.findUnique({
      where: { key: 'api_quota_total' }
    });

    const totalQuota = quotaSetting?.value ? parseInt(quotaSetting.value as string) : 10000;
    
    // Calculate remaining quota
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const quotaLogs = await db.apiQuotaLog.findMany({
      where: {
        date: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
      },
    });

    const usedQuota = quotaLogs.reduce((sum, log) => sum + log.usedUnits, 0);
    const remainingQuota = totalQuota - usedQuota - quotaUsed;

    if (remainingQuota < 0) {
      return NextResponse.json(
        { error: 'API quota exceeded' },
        { status: 429 }
      );
    }

    // Log quota usage
    await db.apiQuotaLog.create({
      data: {
        usedUnits: quotaUsed,
        remainingUnits: remainingQuota,
      },
    });

    // Log the action
    await db.auditLog.create({
      data: {
        userId: decoded.userId,
        action: 'FETCH_YOUTUBE_VIDEO',
        targetType: 'VIDEO',
        targetId: videoId,
        details: {
          quotaUsed,
          remainingQuota,
          title: snippet.title,
        },
      },
    });

    return NextResponse.json({
      message: 'Video data fetched successfully',
      video: videoDetails,
      quota: {
        used: usedQuota + quotaUsed,
        remaining: remainingQuota,
        total: totalQuota,
      },
    });
  } catch (error) {
    console.error('Error fetching YouTube video:', error);
    
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