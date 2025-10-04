import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const decoded = requireAdmin(request);

    // Check database connectivity
    let dbStatus = 'healthy';
    let dbError = null;
    
    try {
      await db.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'unhealthy';
      dbError = error instanceof Error ? error.message : 'Unknown database error';
    }

    // Check YouTube API connectivity
    let youtubeStatus = 'healthy';
    let youtubeError = null;
    
    if (YOUTUBE_API_KEY) {
      try {
        const response = await fetch(
          `${YOUTUBE_API_URL}/videos?part=snippet&id=dQw4w9WgXcQ&key=${YOUTUBE_API_KEY}`
        );
        
        if (!response.ok) {
          youtubeStatus = 'unhealthy';
          youtubeError = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (error) {
        youtubeStatus = 'unhealthy';
        youtubeError = error instanceof Error ? error.message : 'Unknown YouTube API error';
      }
    } else {
      youtubeStatus = 'not_configured';
      youtubeError = 'YouTube API key not configured';
    }

    // Get system statistics
    const [videoCount, channelCount, userCount, auditLogCount] = await Promise.all([
      db.whitelistedVideo.count({ where: { isActive: true } }),
      db.whitelistedChannel.count(),
      db.user.count(),
      db.auditLog.count(),
    ]);

    // Get recent activity
    const recentActivity = await db.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get current month quota usage
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
    
    const quotaSetting = await db.setting.findUnique({
      where: { key: 'api_quota_total' }
    });

    const totalQuota = quotaSetting?.value ? parseInt(quotaSetting.value as string) : 10000;

    return NextResponse.json({
      status: {
        database: {
          status: dbStatus,
          error: dbError,
        },
        youtube_api: {
          status: youtubeStatus,
          error: youtubeError,
        },
      },
      statistics: {
        videos: videoCount,
        channels: channelCount,
        users: userCount,
        auditLogs: auditLogCount,
      },
      quota: {
        total: totalQuota,
        used: usedQuota,
        remaining: totalQuota - usedQuota,
      },
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching health data:', error);
    
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