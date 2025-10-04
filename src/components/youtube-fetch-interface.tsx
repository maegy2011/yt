'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Youtube, 
  Search, 
  Download, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Database,
  Settings
} from 'lucide-react';

interface QuotaData {
  quota: {
    total: number;
    used: number;
    remaining: number;
    percentage: number;
  };
  recentLogs: Array<{
    id: string;
    usedUnits: number;
    remainingUnits: number;
    recordedAt: string;
  }>;
  dailyUsage: Array<{
    date: string;
    usage: number;
  }>;
}

interface YouTubeFetchResult {
  videoId: string;
  title: string;
  description: string;
  thumbnails: any;
  duration: string;
  channelId: string;
  channelTitle: string;
  viewCount: string;
  likeCount: string;
}

export default function YouTubeFetchInterface() {
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoId, setVideoId] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchResult, setFetchResult] = useState<YouTubeFetchResult | null>(null);
  const [fetchError, setFetchError] = useState('');
  const [addToWhitelist, setAddToWhitelist] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchQuotaData();
  }, []);

  const fetchQuotaData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/quota');
      if (response.ok) {
        const data = await response.json();
        setQuotaData(data);
      }
    } catch (error) {
      console.error('Error fetching quota data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchVideo = async () => {
    if (!videoId.trim()) {
      setFetchError('Please enter a video ID');
      return;
    }

    setFetchLoading(true);
    setFetchError('');
    setFetchResult(null);

    try {
      const response = await fetch('/api/youtube/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: videoId.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setFetchResult(data.video);
        setAddToWhitelist(true);
        // Refresh quota data after successful fetch
        fetchQuotaData();
      } else {
        setFetchError(data.error || 'Failed to fetch video');
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      setFetchError('Error fetching video');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleAddToWhitelist = async () => {
    if (!fetchResult) return;

    setAddLoading(true);
    try {
      const response = await fetch('/api/videos/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: fetchResult.videoId,
          title: fetchResult.title,
          description: fetchResult.description,
          thumbnails: fetchResult.thumbnails,
          duration: fetchResult.duration,
          channelId: fetchResult.channelId,
          manualTags: [],
        }),
      });

      if (response.ok) {
        setAddToWhitelist(false);
        setFetchResult(null);
        setVideoId('');
        alert('Video added to whitelist successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add video to whitelist');
      }
    } catch (error) {
      console.error('Error adding video to whitelist:', error);
      alert('Error adding video to whitelist');
    } finally {
      setAddLoading(false);
    }
  };

  const getQuotaColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQuotaProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '';
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: string) => {
    return parseInt(num).toLocaleString('ar-SA');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">جلب فيديوهات يوتيوب</h2>
        <p className="text-muted-foreground">جلب بيانات الفيديوهات من YouTube API مع مراقبة استهلاك الكوتا</p>
      </div>

      <Tabs defaultValue="fetch" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fetch">جلب الفيديو</TabsTrigger>
          <TabsTrigger value="quota">مراقبة الكوتا</TabsTrigger>
        </TabsList>

        <TabsContent value="fetch" className="space-y-6">
          {/* Video Fetch Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-600" />
                جلب بيانات الفيديو
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="أدخل معرف الفيديو (Video ID)"
                  value={videoId}
                  onChange={(e) => setVideoId(e.target.value)}
                  className="flex-1 font-mono"
                />
                <Button 
                  onClick={handleFetchVideo}
                  disabled={fetchLoading || !videoId.trim()}
                >
                  {fetchLoading ? (
                    <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="ml-2 h-4 w-4" />
                  )}
                  جلب
                </Button>
              </div>

              {fetchError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
              )}

              {fetchResult && (
                <div className="space-y-4">
                  <Alert className="border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>تم جلب بيانات الفيديو بنجاح!</AlertDescription>
                  </Alert>

                  {/* Video Preview */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {fetchResult.thumbnails?.default?.url && (
                          <img
                            src={fetchResult.thumbnails.default.url}
                            alt={fetchResult.title}
                            className="w-32 h-24 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 space-y-2">
                          <h3 className="font-semibold text-lg">{fetchResult.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            القناة: {fetchResult.channelTitle}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>المدة: {formatDuration(fetchResult.duration)}</span>
                            <span>المشاهدات: {formatNumber(fetchResult.viewCount)}</span>
                            <span>الإعجابات: {formatNumber(fetchResult.likeCount)}</span>
                          </div>
                        </div>
                      </div>
                      {fetchResult.description && (
                        <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                          {fetchResult.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {addToWhitelist && (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setAddToWhitelist(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleAddToWhitelist} disabled={addLoading}>
                        {addLoading ? (
                          <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="ml-2 h-4 w-4" />
                        )}
                        إضافة للقائمة البيضاء
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quota" className="space-y-6">
          {quotaData && (
            <>
              {/* Quota Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    نظرة عامة على استهلاك الكوتا
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>الاستهلاك الحالي</span>
                      <span className={getQuotaColor(quotaData.quota.percentage)}>
                        {quotaData.quota.used} / {quotaData.quota.total}
                      </span>
                    </div>
                    <Progress 
                      value={quotaData.quota.percentage} 
                      className="h-3"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>{quotaData.quota.percentage.toFixed(1)}%</span>
                      <span>{quotaData.quota.total}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{quotaData.quota.used}</div>
                      <div className="text-sm text-muted-foreground">مستخدم</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{quotaData.quota.remaining}</div>
                      <div className="text-sm text-muted-foreground">متبقي</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{quotaData.quota.total}</div>
                      <div className="text-sm text-muted-foreground">الإجمالي</div>
                    </div>
                  </div>

                  {quotaData.quota.percentage > 80 && (
                    <Alert className="border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription>
                        اقترب استهلاك الكوتا من الحد الأقصى ({quotaData.quota.percentage.toFixed(1)}%)
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Daily Usage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    الاستخدام اليومي (آخر 7 أيام)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {quotaData.dailyUsage.map((day, index) => (
                      <div key={day.date} className="flex items-center gap-4">
                        <div className="w-24 text-sm">{day.date}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(day.usage / quotaData.quota.total) * 100} 
                              className="flex-1 h-2"
                            />
                            <span className="text-sm font-medium w-12 text-left">
                              {day.usage}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    الاستخدام الأخير
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {quotaData.recentLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{log.usedUnits} وحدة</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.recordedAt).toLocaleString('ar-SA')}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          متبقي: {log.remainingUnits}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <h3 className="font-semibold">الإعدادات</h3>
            <p className="text-sm text-muted-foreground">تكوين YouTube API</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold">السجلات</h3>
            <p className="text-sm text-muted-foreground">عرض سجلات الاستخدام</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Settings className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold">الكوتا</h3>
            <p className="text-sm text-muted-foreground">إدارة الحدود الشهرية</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}