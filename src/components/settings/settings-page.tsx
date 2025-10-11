'use client';

import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Monitor, 
  Languages, 
  Video, 
  Bell, 
  Shield, 
  RotateCcw,
  Save,
  Palette,
  Wifi,
  User,
  Globe,
  Download,
  Upload,
  Trash2,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/settings-context';

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  // Additional settings state
  const [dataUsage, setDataUsage] = useState({
    autoPlay: true,
    backgroundPlay: false,
    downloadQuality: 'hd',
    streamQuality: 'auto',
    dataSaver: false
  });

  const [privacySettings, setPrivacySettings] = useState({
    privateAccount: false,
    activityStatus: true,
    searchHistory: true,
    watchHistory: true,
    personalizedAds: true
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: settings.theme,
    language: settings.language,
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false
  });

  const handleSettingChange = (key: keyof typeof tempSettings, value: any) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleDataUsageChange = (key: keyof typeof dataUsage, value: any) => {
    setDataUsage(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handlePrivacyChange = (key: keyof typeof privacySettings, value: any) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleAppearanceChange = (key: keyof typeof appearanceSettings, value: any) => {
    setAppearanceSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings(tempSettings);
    setHasChanges(false);
    toast({
      title: 'تم حفظ الإعدادات',
      description: 'تم تحديث الإعدادات بنجاح',
    });
  };

  const handleReset = () => {
    resetSettings();
    setTempSettings(settings);
    setHasChanges(false);
    toast({
      title: 'تم إعادة تعيين الإعدادات',
      description: 'تم العودة إلى الإعدادات الافتراضية',
    });
  };

  const handleClearData = (dataType: string) => {
    toast({
      title: 'تم المسح',
      description: `تم مسح بيانات ${dataType} بنجاح`,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground">تخصيص تجربتك في ماي يوتيوب</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">عام</TabsTrigger>
          <TabsTrigger value="appearance">المظهر</TabsTrigger>
          <TabsTrigger value="privacy">الخصوصية</TabsTrigger>
          <TabsTrigger value="data">البيانات</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Language Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  اللغة والمنطقة
                </CardTitle>
                <CardDescription>
                  اختر لغة التطبيق والإعدادات الإقليمية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>لغة التطبيق</Label>
                  <Select 
                    value={tempSettings.language} 
                    onValueChange={(value) => handleSettingChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر اللغة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>منطقة المحتوى</Label>
                  <Select defaultValue="sa">
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنطقة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sa">السعودية</SelectItem>
                      <SelectItem value="ae">الإمارات</SelectItem>
                      <SelectItem value="eg">مصر</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Video Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  إعدادات الفيديو
                </CardTitle>
                <CardDescription>
                  تخصيص إعدادات تشغيل الفيديو والجودة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>جودة الفيديو الافتراضية</Label>
                  <Select 
                    value={tempSettings.videoQuality} 
                    onValueChange={(value) => handleSettingChange('videoQuality', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الجودة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">تلقائي</SelectItem>
                      <SelectItem value="hd1080">1080p HD</SelectItem>
                      <SelectItem value="hd720">720p HD</SelectItem>
                      <SelectItem value="sd">480p SD</SelectItem>
                      <SelectItem value="low">360p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تشغيل تلقائي</Label>
                    <p className="text-sm text-muted-foreground">
                      تشغيل الفيديو التالي تلقائياً
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.autoplay}
                    onCheckedChange={(checked) => handleSettingChange('autoplay', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تشغيل الخلفية</Label>
                    <p className="text-sm text-muted-foreground">
                      تشغيل الصوت عند تصغير التطبيق
                    </p>
                  </div>
                  <Switch
                    checked={dataUsage.backgroundPlay}
                    onCheckedChange={(checked) => handleDataUsageChange('backgroundPlay', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  الإشعارات
                </CardTitle>
                <CardDescription>
                  إدارة إعدادات الإشعارات والتنبيهات
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تفعيل الإشعارات</Label>
                    <p className="text-sm text-muted-foreground">
                      تلقي إشعارات عند توفر محتوى جديد
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.notifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>إشعارات القنوات</Label>
                    <p className="text-sm text-muted-foreground">
                      إشعارات عند نشر فيديوهات جديدة
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>إشعارات الردود</Label>
                    <p className="text-sm text-muted-foreground">
                      إشعارات عند الردود على تعليقاتك
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  الخصوصية والأمان
                </CardTitle>
                <CardDescription>
                  إعدادات البحث الآمن والخصوصية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>البحث الآمن</Label>
                    <p className="text-sm text-muted-foreground">
                      تصفية المحتوى غير المناسب
                    </p>
                  </div>
                  <Switch
                    checked={tempSettings.safeSearch}
                    onCheckedChange={(checked) => handleSettingChange('safeSearch', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>سجل البحث</Label>
                    <p className="text-sm text-muted-foreground">
                      حفظ تاريخ البحث
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.searchHistory}
                    onCheckedChange={(checked) => handlePrivacyChange('searchHistory', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>سجل المشاهدة</Label>
                    <p className="text-sm text-muted-foreground">
                      حفظ تاريخ المشاهدة
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.watchHistory}
                    onCheckedChange={(checked) => handlePrivacyChange('watchHistory', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  المظهر
                </CardTitle>
                <CardDescription>
                  اختر مظهر التطبيق المفضل لديك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={appearanceSettings.theme} 
                  onValueChange={(value) => handleAppearanceChange('theme', value)}
                  className="grid grid-cols-1 gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Sun className="h-4 w-4" />
                      <div>
                        <div className="font-medium">فاتح</div>
                        <div className="text-sm text-muted-foreground">ألوان فاتحة وواضحة</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Moon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">داكن</div>
                        <div className="text-sm text-muted-foreground">ألوان داكنة للراحة</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Monitor className="h-4 w-4" />
                      <div>
                        <div className="font-medium">النظام</div>
                        <div className="text-sm text-muted-foreground">مطابق لإعدادات الجهاز</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Accessibility Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  إمكانية الوصول
                </CardTitle>
                <CardDescription>
                  إعدادات تسهل استخدام التطبيق
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>حجم الخط</Label>
                  <Select value={appearanceSettings.fontSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر حجم الخط" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">صغير</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="large">كبير</SelectItem>
                      <SelectItem value="xlarge">كبير جداً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تقليل الحركة</Label>
                    <p className="text-sm text-muted-foreground">
                      تقليل الرسوم المتحركة
                    </p>
                  </div>
                  <Switch
                    checked={appearanceSettings.reducedMotion}
                    onCheckedChange={(checked) => handleAppearanceChange('reducedMotion', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تباين عالي</Label>
                    <p className="text-sm text-muted-foreground">
                      ألوان ذات تباين عالي
                    </p>
                  </div>
                  <Switch
                    checked={appearanceSettings.highContrast}
                    onCheckedChange={(checked) => handleAppearanceChange('highContrast', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  خصوصية الحساب
                </CardTitle>
                <CardDescription>
                  إعدادات خصوصية حسابك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>حساب خاص</Label>
                    <p className="text-sm text-muted-foreground">
                      جعل حسابك خاصاً
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.privateAccount}
                    onCheckedChange={(checked) => handlePrivacyChange('privateAccount', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>حالة النشاط</Label>
                    <p className="text-sm text-muted-foreground">
                      إظهار حالة نشاطك
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.activityStatus}
                    onCheckedChange={(checked) => handlePrivacyChange('activityStatus', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>إعلانات مخصصة</Label>
                    <p className="text-sm text-muted-foreground">
                      إعلانات مبنية على اهتماماتك
                </p>
                  </div>
                  <Switch
                    checked={privacySettings.personalizedAds}
                    onCheckedChange={(checked) => handlePrivacyChange('personalizedAds', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  إدارة البيانات
                </CardTitle>
                <CardDescription>
                  إدارة بياناتك وسجل النشاط
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleClearData('سجل البحث')}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    مسح سجل البحث
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleClearData('سجل المشاهدة')}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    مسح سجل المشاهدة
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleClearData('الذاكرة المؤقتة')}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    مسح الذاكرة المؤقتة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Data Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  استخدام البيانات
                </CardTitle>
                <CardDescription>
                  إعدادات استخدام البيانات والجودة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>جودة التدفق</Label>
                  <Select value={dataUsage.streamQuality}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الجودة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">تلقائي</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="low">منخفضة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>جودة التحميل</Label>
                  <Select value={dataUsage.downloadQuality}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الجودة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hd1080">1080p HD</SelectItem>
                      <SelectItem value="hd720">720p HD</SelectItem>
                      <SelectItem value="sd">480p SD</SelectItem>
                      <SelectItem value="low">360p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>موفر البيانات</Label>
                    <p className="text-sm text-muted-foreground">
                      تقليل استخدام البيانات
                    </p>
                  </div>
                  <Switch
                    checked={dataUsage.dataSaver}
                    onCheckedChange={(checked) => handleDataUsageChange('dataSaver', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Storage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  التخزين والتحميل
                </CardTitle>
                <CardDescription>
                  إعدادات التخزين والتحميل
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">الفيديوهات المحملة</span>
                    <Badge variant="secondary">23 فيديو</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">المساحة المستخدمة</span>
                    <Badge variant="secondary">1.2 GB</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">المساحة المتاحة</span>
                    <Badge variant="outline">8.8 GB</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 ml-2" />
                    إدارة التحميلات
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <Trash2 className="h-4 w-4 ml-2" />
                    مسح التحميلات
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button 
          variant="outline" 
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          إعادة تعيين
        </Button>
        <Button 
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          حفظ التغييرات
        </Button>
      </div>
    </div>
  );
}