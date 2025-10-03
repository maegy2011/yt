'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Settings, Eye, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Channel {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  addedAt: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newChannel, setNewChannel] = useState({
    id: '',
    name: '',
    description: '',
    thumbnailUrl: '',
    category: ''
  });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchChannels();
    }
  }, []);

  const handleLogin = () => {
    // Simple password authentication (in production, use proper auth)
    if (password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
      fetchChannels();
    } else {
      alert('كلمة المرور غير صحيحة');
    }
  };

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/channels');
      if (response.ok) {
        const data = await response.json();
        setChannels(data);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = async () => {
    if (!newChannel.id || !newChannel.name) {
      alert('معرف القناة والاسم مطلوبان');
      return;
    }

    // Validate channel ID format (should start with UC...)
    if (!newChannel.id.startsWith('UC')) {
      alert('معرف القناة يجب أن يبدأ بـ UC...');
      return;
    }

    try {
      setAdding(true);
      console.log('Sending channel data:', newChannel);
      
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newChannel),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        await fetchChannels();
        setNewChannel({ id: '', name: '', description: '', thumbnailUrl: '', category: '' });
        setShowAddDialog(false);
        alert('تمت إضافة القناة بنجاح!');
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert(error.error || 'فشل في إضافة القناة');
      }
    } catch (error) {
      console.error('Error adding channel:', error);
      alert('فشل في إضافة القناة: ' + error.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      const response = await fetch(`/api/channels/${channelId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchChannels();
      } else {
        alert('فشل في حذف القناة');
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
      alert('فشل في حذف القناة');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Settings className="h-5 w-5" />
              لوحة التحكم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="mt-1"
                />
              </div>
              <Button onClick={handleLogin} className="w-full">
                دخول
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">لوحة التحكم</h1>
              <p className="text-muted-foreground">إدارة القنوات الإسلامية المعتمدة</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/">
                  <Eye className="h-4 w-4 ml-2" />
                  عرض الموقع
                </Link>
              </Button>
              <Button
                onClick={() => {
                  localStorage.removeItem('adminAuth');
                  setIsAuthenticated(false);
                }}
                variant="outline"
              >
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Add Channel Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>إضافة قناة جديدة</span>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة قناة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة قناة جديدة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="channelId">معرف القناة (Channel ID)</Label>
                      <Input
                        id="channelId"
                        value={newChannel.id}
                        onChange={(e) => setNewChannel({ ...newChannel, id: e.target.value })}
                        placeholder="UC..."
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        معرف القناة من يوتيوب (يبدأ بـ UC...)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        مثال: UCXbP_pDv9wEeT9tOEGiZU2g
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="channelName">اسم القناة</Label>
                      <Input
                        id="channelName"
                        value={newChannel.name}
                        onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                        placeholder="اسم القناة"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">التصنيف</Label>
                      <Input
                        id="category"
                        value={newChannel.category}
                        onChange={(e) => setNewChannel({ ...newChannel, category: e.target.value })}
                        placeholder="مثل: قرآن، دروس، خطب..."
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="thumbnailUrl">رابط الصورة</Label>
                      <Input
                        id="thumbnailUrl"
                        value={newChannel.thumbnailUrl}
                        onChange={(e) => setNewChannel({ ...newChannel, thumbnailUrl: e.target.value })}
                        placeholder="رابط صورة القناة"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">الوصف</Label>
                      <Textarea
                        id="description"
                        value={newChannel.description}
                        onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
                        placeholder="وصف القناة"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={handleAddChannel} disabled={adding} className="flex-1">
                        {adding ? 'جاري الإضافة...' : 'إضافة القناة'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              أضف قنوات يوتيوب الإسلامية المعتمدة إلى القائمة البيضاء. يجب أن تكون القنوات متوافقة مع المعايير الإسلامية وخالية من المحتوى غير اللائق.
            </p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>ملاحظة:</strong> لعرض الفيديوهات الحقيقية من يوتيوب، تحتاج إلى إضافة مفتاح YouTube API صحيح في متغيرات البيئة. حالياً، التطبيق يعرض فيديوهات تجريبية لأغراض الاختبار.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>كيفية الحصول على معرف القناة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p><strong>الخطوات:</strong></p>
              <ol className="list-decimal list-inside space-y-2 mr-4">
                <li>اذهب إلى صفحة القناة على يوتيوب</li>
                <li>انظر إلى رابط الصفحة في المتصفح</li>
                <li>ابحث عن معرف القناة الذي يبدأ بـ <code className="bg-muted px-1 rounded">UC...</code></li>
                <li>انسخ المعرف وأضفه في حقل "معرف القناة"</li>
              </ol>
              <p><strong>مثال على رابط القناة:</strong></p>
              <p className="bg-muted p-2 rounded text-xs font-mono">
                https://www.youtube.com/channel/<strong>UCXbP_pDv9wEeT9tOEGiZU2g</strong>
              </p>
              <p className="text-muted-foreground">
                الجزء المظلل هو معرف القناة الذي يجب نسخه
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Channels List */}
        <Card>
          <CardHeader>
            <CardTitle>القنوات المعتمدة ({channels.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            ) : channels.length > 0 ? (
              <div className="space-y-4">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      {channel.thumbnailUrl ? (
                        <img
                          src={channel.thumbnailUrl}
                          alt={channel.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Eye className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{channel.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {channel.category && (
                          <Badge variant="secondary">{channel.category}</Badge>
                        )}
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 ml-1" />
                          {formatDate(channel.addedAt)}
                        </div>
                      </div>
                      {channel.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {channel.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        ID: {channel.id}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/channel/${channel.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف القناة</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف قناة "{channel.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteChannel(channel.id)}>
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد قنوات معتمدة بعد. أضف أول قناة باستخدام الزر أعلاه.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}