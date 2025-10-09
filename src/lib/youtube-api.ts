// YouTube Data API v3 Quota Costs
export const YOUTUBE_API_QUOTA_COSTS = {
  activities: { list: 1 },
  captions: { list: 50, insert: 400, update: 450, delete: 50 },
  channelBanners: { insert: 50 },
  channels: { list: 1, update: 50 },
  channelSections: { list: 1, insert: 50, update: 50, delete: 50 },
  comments: { list: 1, insert: 50, update: 50, setModerationStatus: 50, delete: 50 },
  commentThreads: { list: 1, insert: 50, update: 50 },
  guideCategories: { list: 1 },
  i18nLanguages: { list: 1 },
  i18nRegions: { list: 1 },
  members: { list: 1 },
  membershipsLevels: { list: 1 },
  playlistItems: { list: 1, insert: 50, update: 50, delete: 50 },
  playlists: { list: 1, insert: 50, update: 50, delete: 50 },
  search: { list: 100 },
  subscriptions: { list: 1, insert: 50, delete: 50 },
  thumbnails: { set: 50 },
  videoAbuseReportReasons: { list: 1 },
  videoCategories: { list: 1 },
  videos: { list: 1, insert: 1600, update: 50, rate: 50, getRating: 1, reportAbuse: 50, delete: 50 },
  watermarks: { set: 50, unset: 50 }
} as const;

export interface ApiCallRecord {
  endpoint: keyof typeof YOUTUBE_API_QUOTA_COSTS;
  method: string;
  cost: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface QuotaUsage {
  totalCalls: number;
  totalCost: number;
  dailyQuota: number;
  remainingQuota: number;
  callsByEndpoint: Record<string, {
    count: number;
    cost: number;
  }>;
  recentCalls: ApiCallRecord[];
}

class YouTubeApiTracker {
  private dailyQuota: number = 10000; // Default daily quota
  private calls: ApiCallRecord[] = [];

  constructor(dailyQuota: number = 10000) {
    this.dailyQuota = dailyQuota;
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      // Only access localStorage on the client side
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('youtubeApiCalls');
        if (saved) {
          this.calls = JSON.parse(saved);
        }
      }
    } catch (error) {
      console.warn('Failed to load API calls from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      // Only access localStorage on the client side
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('youtubeApiCalls', JSON.stringify(this.calls));
      }
    } catch (error) {
      console.warn('Failed to save API calls to storage:', error);
    }
  }

  public reset(): void {
    this.calls = [];
    this.saveToStorage();
  }

  public clearOldCalls(days: number = 1): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    this.calls = this.calls.filter(call => 
      new Date(call.timestamp) > cutoffDate
    );
    this.saveToStorage();
  }

  public recordCall(endpoint: keyof typeof YOUTUBE_API_QUOTA_COSTS, method: string, success: boolean = true, error?: string): void {
    const cost = YOUTUBE_API_QUOTA_COSTS[endpoint][method as keyof typeof YOUTUBE_API_QUOTA_COSTS[keyof typeof YOUTUBE_API_QUOTA_COSTS]] || 1;
    
    const call: ApiCallRecord = {
      endpoint,
      method,
      cost,
      timestamp: new Date().toISOString(),
      success,
      error
    };

    this.calls.push(call);
    this.saveToStorage();
  }

  public getQuotaUsage(): QuotaUsage {
    const totalCost = this.calls.reduce((sum, call) => sum + call.cost, 0);
    const callsByEndpoint: Record<string, { count: number; cost: number }> = {};
    
    this.calls.forEach(call => {
      const key = `${call.endpoint}.${call.method}`;
      if (!callsByEndpoint[key]) {
        callsByEndpoint[key] = { count: 0, cost: 0 };
      }
      callsByEndpoint[key].count++;
      callsByEndpoint[key].cost += call.cost;
    });

    return {
      totalCalls: this.calls.length,
      totalCost,
      dailyQuota: this.dailyQuota,
      remainingQuota: Math.max(0, this.dailyQuota - totalCost),
      callsByEndpoint,
      recentCalls: this.calls.slice(-50) // Last 50 calls
    };
  }

  public canMakeCall(endpoint: keyof typeof YOUTUBE_API_QUOTA_COSTS, method: string, buffer: number = 100): boolean {
    const cost = YOUTUBE_API_QUOTA_COSTS[endpoint][method as keyof typeof YOUTUBE_API_QUOTA_COSTS[keyof typeof YOUTUBE_API_QUOTA_COSTS]] || 1;
    const usage = this.getQuotaUsage();
    return (usage.totalCost + cost + buffer) <= this.dailyQuota;
  }

  public getQuotaWarning(): string | null {
    const usage = this.getQuotaUsage();
    const usagePercentage = (usage.totalCost / usage.dailyQuota) * 100;
    
    if (usagePercentage >= 90) {
      return `⚠️ تحذير شديد: لقد استخدمت ${usagePercentage.toFixed(1)}% من حصة API اليومية`;
    } else if (usagePercentage >= 75) {
      return `⚠️ تحذير: لقد استخدمت ${usagePercentage.toFixed(1)}% من حصة API اليومية`;
    } else if (usagePercentage >= 50) {
      return `ℹ️ معلومة: لقد استخدمت ${usagePercentage.toFixed(1)}% من حصة API اليومية`;
    }
    
    return null;
  }

  public setDailyQuota(quota: number): void {
    this.dailyQuota = quota;
    this.saveToStorage();
  }
}

// Global instance
export const youtubeApiTracker = new YouTubeApiTracker();

// Helper functions for common API calls
export const trackChannelListCall = (success: boolean = true, error?: string) => {
  youtubeApiTracker.recordCall('channels', 'list', success, error);
};

export const trackVideoListCall = (success: boolean = true, error?: string) => {
  youtubeApiTracker.recordCall('videos', 'list', success, error);
};

export const trackSearchListCall = (success: boolean = true, error?: string) => {
  youtubeApiTracker.recordCall('search', 'list', success, error);
};

export const canMakeChannelListCall = (buffer: number = 100) => {
  return youtubeApiTracker.canMakeCall('channels', 'list', buffer);
};

export const canMakeVideoListCall = (buffer: number = 100) => {
  return youtubeApiTracker.canMakeCall('videos', 'list', buffer);
};

export const canMakeSearchListCall = (buffer: number = 100) => {
  return youtubeApiTracker.canMakeCall('search', 'list', buffer);
};