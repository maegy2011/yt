'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminAuthCheck from '@/components/admin-auth-check';
import VideoManagement from '@/components/video-management';
import ChannelManagement from '@/components/channel-management';
import UserManagement from '@/components/user-management';
import YouTubeFetchInterface from '@/components/youtube-fetch-interface';
import AuditLogsViewer from '@/components/audit-logs-viewer';
import SystemSettingsManagement from '@/components/system-settings-management';
import { 
  Database, 
  Globe, 
  Users, 
  Video, 
  BarChart3, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Settings,
  FileText,
  Zap,
  Shield,
  Youtube
} from 'lucide-react';

interface HealthData {
  status: {
    database: {
      status: string;
      error?: string;
    };
    youtube_api: {
      status: string;
      error?: string;
    };
  };
  statistics: {
    videos: number;
    channels: number;
    users: number;
    auditLogs: number;
  };
  quota: {
    total: number;
    used: number;
    remaining: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    targetType: string;
    createdAt: string;
    user?: {
      email: string;
    };
  }>;
}

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

export default function AdminDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [healthResponse, quotaResponse] = await Promise.all([
        fetch('/api/admin/health'),
        fetch('/api/admin/quota')
      ]);

      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setHealthData(health);
      }

      if (quotaResponse.ok) {
        const quota = await quotaResponse.json();
        setQuotaData(quota);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'unhealthy': return 'text-red-600';
      case 'not_configured': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'unhealthy': return <AlertTriangle className="h-4 w-4" />;
      case 'not_configured': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA');
  };

  const formatAction = (action: string) => {
    const actions: { [key: string]: string } = {
      'ADD_VIDEO': 'إضافة فيديو',
      'UPDATE_VIDEO': 'تحديث فيديو',
      'ADD_CHANNEL': 'إضافة قناة',
      'FETCH_YOUTUBE_VIDEO': 'جلب بيانات يوتيوب',
    };
    return actions[action] || action;
  };

  const formatTargetType = (type: string) => {
    const types: { [key: string]: string } = {
      'VIDEO': 'فيديو',
      'CHANNEL': 'قناة',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AdminAuthCheck>
      <div className="min-h-screen bg-background" dir="rtl">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-primary">لوحة التحكم - YT Islami</h1>
              <Button onClick={fetchData} variant="outline" size="sm">
                تحديث
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="videos">الفيديوهات</TabsTrigger>
              <TabsTrigger value="channels">القنوات</TabsTrigger>
              <TabsTrigger value="youtube">يوتيوب</TabsTrigger>
              <TabsTrigger value="users">المستخدمون</TabsTrigger>
              <TabsTrigger value="logs">السجلات</TabsTrigger>
              <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    حالة النظام
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {healthData && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">قاعدة البيانات</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${getStatusColor(healthData.status.database.status)}`}>
                            {healthData.status.database.status === 'healthy' ? 'سليمة' : 
                             healthData.status.database.status === 'unhealthy' ? 'معطلة' : 'غير مهيأة'}
                          </span>
                          {getStatusIcon(healthData.status.database.status)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">YouTube API</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${getStatusColor(healthData.status.youtube_api.status)}`}>
                            {healthData.status.youtube_api.status === 'healthy' ? 'سليمة' : 
                             healthData.status.youtube_api.status === 'unhealthy' ? 'معطلة' : 'غير مهيأة'}
                          </span>
                          {getStatusIcon(healthData.status.youtube_api.status)}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    الإحصائيات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {healthData && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{healthData.statistics.videos}</div>
                        <div className="text-sm text-muted-foreground">فيديوهات</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{healthData.statistics.channels}</div>
                        <div className="text-sm text-muted-foreground">قنوات</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{healthData.statistics.users}</div>
                        <div className="text-sm text-muted-foreground">مستخدمين</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{healthData.statistics.auditLogs}</div>
                        <div className="text-sm text-muted-foreground">سجلات</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="h-20 flex-col gap-2" variant="outline">
                    <Video className="h-6 w-6" />
                    <span>إضافة فيديو</span>
                  </Button>
                  <Button className="h-20 flex-col gap-2" variant="outline">
                    <Users className="h-6 w-6" />
                    <span>المستخدمين</span>
                  </Button>
                  <Button className="h-20 flex-col gap-2" variant="outline">
                    <Globe className="h-6 w-6" />
                    <span>القنوات</span>
                  </Button>
                  <Button className="h-20 flex-col gap-2" variant="outline">
                    <Youtube className="h-6 w-6" />
                    <span>يوتيوب API</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  النشاط الأخير
                </CardTitle>
              </CardHeader>
              <CardContent>
                {healthData && (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {healthData.recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <div>
                            <div className="font-medium">
                              {formatAction(activity.action)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTargetType(activity.targetType)} • {activity.user?.email}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground text-left">
                          {formatDate(activity.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos">
            <VideoManagement onVideoUpdate={fetchData} />
          </TabsContent>

          <TabsContent value="channels">
            <ChannelManagement onChannelUpdate={fetchData} />
          </TabsContent>

          <TabsContent value="youtube">
            <YouTubeFetchInterface />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement onUserUpdate={fetchData} />
          </TabsContent>

          <TabsContent value="logs">
            <AuditLogsViewer />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettingsManagement />
          </TabsContent>
        </Tabs>
      </main>
      </div>
    </AdminAuthCheck>
  );
}