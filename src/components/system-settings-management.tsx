'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Globe,
  Shield,
  Database,
  Zap,
  Key,
  Bell,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Users,
  Video,
  Youtube
} from 'lucide-react';

interface SystemSettings {
  api_quota_total: number;
  youtube_api_key: string;
  site_title: string;
  site_description: string;
  enable_registration: boolean;
  enable_guest_access: boolean;
  max_videos_per_page: number;
  cache_ttl: number;
  enable_audit_logs: boolean;
  notification_email: string;
  maintenance_mode: boolean;
}

export default function SystemSettingsManagement() {
  const [settings, setSettings] = useState<SystemSettings>({
    api_quota_total: 10000,
    youtube_api_key: '',
    site_title: 'YT Islami',
    site_description: 'منصة إسلامية لمشاهدة الفيديوهات التعليمية',
    enable_registration: false,
    enable_guest_access: true,
    max_videos_per_page: 12,
    cache_ttl: 3600,
    enable_audit_logs: true,
    notification_email: '',
    maintenance_mode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Note: You would need to create a settings API endpoint
      // For now, we'll use default values
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage('');

    try {
      // Note: You would need to create a settings update API endpoint
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('تم حفظ الإعدادات بنجاح!');
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين الإعدادات إلى القيم الافتراضية؟')) {
      setSettings({
        api_quota_total: 10000,
        youtube_api_key: '',
        site_title: 'YT Islami',
        site_description: 'منصة إسلامية لمشاهدة الفيديوهات التعليمية',
        enable_registration: false,
        enable_guest_access: true,
        max_videos_per_page: 12,
        cache_ttl: 3600,
        enable_audit_logs: true,
        notification_email: '',
        maintenance_mode: false,
      });
      setMessage('تم إعادة تعيين الإعدادات إلى القيم الافتراضية');
    }
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">إعدادات النظام</h2>
          <p className="text-muted-foreground">تكوين إعدادات النظام والميزات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleResetSettings}>
            <RefreshCw className="ml-2 h-4 w-4" />
            إعادة تعيين
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="ml-2 h-4 w-4" />
            )}
            حفظ الإعدادات
          </Button>
        </div>
      </div>

      {message && (
        <Alert className={message.includes('نجاح') ? 'border-green-200' : 'border-red-200'}>
          {message.includes('نجاح') ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
          <TabsTrigger value="advanced">متقدم</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Site Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  إعدادات الموقع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site_title">عنوان الموقع</Label>
                  <Input
                    id="site_title"
                    value={settings.site_title}
                    onChange={(e) => updateSetting('site_title', e.target.value)}
                    placeholder="YT Islami"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="site_description">وصف الموقع</Label>
                  <Textarea
                    id="site_description"
                    value={settings.site_description}
                    onChange={(e) => updateSetting('site_description', e.target.value)}
                    placeholder="منصة إسلامية لمشاهدة الفيديوهات التعليمية"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenance_mode"
                    checked={settings.maintenance_mode}
                    onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
                  />
                  <Label htmlFor="maintenance_mode">وضع الصيانة</Label>
                </div>

                {settings.maintenance_mode && (
                  <Alert className="border-orange-200">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription>
                      الموقع في وضع الصيانة. فقط المديرون يمكنهم الوصول إلى النظام.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* User Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  إعدادات المستخدمين
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_registration"
                    checked={settings.enable_registration}
                    onCheckedChange={(checked) => updateSetting('enable_registration', checked)}
                  />
                  <Label htmlFor="enable_registration">تمكين التسجيل</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_guest_access"
                    checked={settings.enable_guest_access}
                    onCheckedChange={(checked) => updateSetting('enable_guest_access', checked)}
                  />
                  <Label htmlFor="enable_guest_access">تمكين الوصول للضيوف</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification_email">بريد الإشعارات</Label>
                  <Input
                    id="notification_email"
                    type="email"
                    value={settings.notification_email}
                    onChange={(e) => updateSetting('notification_email', e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* YouTube API */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-600" />
                  YouTube API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="youtube_api_key">مفتاح API</Label>
                  <Input
                    id="youtube_api_key"
                    type="password"
                    value={settings.youtube_api_key}
                    onChange={(e) => updateSetting('youtube_api_key', e.target.value)}
                    placeholder="AIzaSy..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api_quota_total">الحد الشهري للكوتا</Label>
                  <Input
                    id="api_quota_total"
                    type="number"
                    value={settings.api_quota_total}
                    onChange={(e) => updateSetting('api_quota_total', parseInt(e.target.value))}
                    min="1000"
                    max="1000000"
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>• الحد الأدنى: 1,000 وحدة</p>
                  <p>• الحد الأقصى: 1,000,000 وحدة</p>
                  <p>• متوسط الاستخدام: 1 وحدة لكل فيديو</p>
                </div>
              </CardContent>
            </Card>

            {/* Cache Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  إعدادات التخزين المؤقت
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cache_ttl">مدة التخزين المؤقت (بالثواني)</Label>
                  <Input
                    id="cache_ttl"
                    type="number"
                    value={settings.cache_ttl}
                    onChange={(e) => updateSetting('cache_ttl', parseInt(e.target.value))}
                    min="300"
                    max="86400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_videos_per_page">الحد الأقصى للفيديوهات في الصفحة</Label>
                  <Input
                    id="max_videos_per_page"
                    type="number"
                    value={settings.max_videos_per_page}
                    onChange={(e) => updateSetting('max_videos_per_page', parseInt(e.target.value))}
                    min="6"
                    max="50"
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>• التوصية: 3600 ثانية (ساعة واحدة)</p>
                  <p>• التوصية: 12 فيديو للصفحة</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  إعدادات الأمان
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_audit_logs"
                    checked={settings.enable_audit_logs}
                    onCheckedChange={(checked) => updateSetting('enable_audit_logs', checked)}
                  />
                  <Label htmlFor="enable_audit_logs">تمكين سجلات التدقيق</Label>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>• يسجل جميع نشاطات المستخدمين</p>
                  <p>• يساعد في مراقبة الأمان</p>
                  <p>• قد يؤثر على الأداء إذا كان هناك الكثير من النشاط</p>
                </div>

                <Alert className="border-blue-200">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    تأكد من تغيير كلمات المرور الافتراضية وتحديث المفاتيح الأمنية بانتظام.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Access Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  التحكم في الوصول
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">التسجيل</span>
                    <Badge variant={settings.enable_registration ? "default" : "secondary"}>
                      {settings.enable_registration ? "مفعل" : "معطل"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">الوصول للضيوف</span>
                    <Badge variant={settings.enable_guest_access ? "default" : "secondary"}>
                      {settings.enable_guest_access ? "مفعل" : "معطل"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">سجلات التدقيق</span>
                    <Badge variant={settings.enable_audit_logs ? "default" : "secondary"}>
                      {settings.enable_audit_logs ? "مفعل" : "معطل"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">وضع الصيانة</span>
                    <Badge variant={settings.maintenance_mode ? "destructive" : "default"}>
                      {settings.maintenance_mode ? "مفعل" : "معطل"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  إعدادات الأداء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">مدة التخزين المؤقت</span>
                    <Badge variant="outline">{settings.cache_ttl} ثانية</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">الفيديوهات لكل صفحة</span>
                    <Badge variant="outline">{settings.max_videos_per_page}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">حدود الكوتا</span>
                    <Badge variant="outline">{settings.api_quota_total.toLocaleString('ar-SA')}</Badge>
                  </div>
                </div>

                <Alert className="border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    الإعدادات الحالية محسنة للأداء الجيد.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  معلومات النظام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">إصدار Next.js</span>
                    <Badge variant="outline">15.x</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">قاعدة البيانات</span>
                    <Badge variant="outline">SQLite</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">البيئة</span>
                    <Badge variant="outline">Development</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">آخر تحديث</span>
                    <Badge variant="outline">{new Date().toLocaleDateString('ar-SA')}</Badge>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <RefreshCw className="ml-2 h-4 w-4" />
                  تحديث المعلومات
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}