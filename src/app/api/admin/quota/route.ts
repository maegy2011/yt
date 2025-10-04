import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const decoded = requireAdmin(request);

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
      orderBy: { recordedAt: 'desc' },
    });

    // Calculate quota usage
    const usedQuota = quotaLogs.reduce((sum, log) => sum + log.usedUnits, 0);
    
    // Get total quota setting
    const quotaSetting = await db.setting.findUnique({
      where: { key: 'api_quota_total' }
    });

    const totalQuota = quotaSetting?.value ? parseInt(quotaSetting.value as string) : 10000;
    const remainingQuota = totalQuota - usedQuota;
    const usagePercentage = (usedQuota / totalQuota) * 100;

    // Get recent quota logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = await db.apiQuotaLog.findMany({
      where: {
        recordedAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: { recordedAt: 'desc' },
      take: 50,
    });

    // Get daily usage for the last 7 days
    const dailyUsage = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayLogs = await db.apiQuotaLog.findMany({
        where: {
          recordedAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      const dayUsage = dayLogs.reduce((sum, log) => sum + log.usedUnits, 0);
      
      dailyUsage.push({
        date: date.toISOString().split('T')[0],
        usage: dayUsage,
      });
    }

    return NextResponse.json({
      quota: {
        total: totalQuota,
        used: usedQuota,
        remaining: remainingQuota,
        percentage: usagePercentage,
      },
      recentLogs,
      dailyUsage,
    });
  } catch (error) {
    console.error('Error fetching quota data:', error);
    
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