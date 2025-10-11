'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Video as VideoIcon, TrendingUp, Home as HomeIcon, 
  Music, Gamepad2, Trophy, Mic, Film, Settings, User,
  Menu, X, Clock, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResponsiveVideoGrid } from '@/components/video/responsive-video-grid';
import { SettingsButton } from '@/components/settings/settings-button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useApiToast } from '@/hooks/use-api-toast';
import { useSettings } from '@/contexts/settings-context';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { showError, showSuccess } = useApiToast();
  const { settings } = useSettings();

  // Video categories
  const categories = [
    { id: 'all', name: 'الكل', icon: VideoIcon },
    { id: 'music', name: 'موسيقى', icon: Music },
    { id: 'gaming', name: 'ألعاب', icon: Gamepad2 },
    { id: 'sports', name: 'رياضة', icon: Trophy },
    { id: 'entertainment', name: 'ترفيه', icon: Film },
  ];

  // Enhanced search with safe search option
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showError('الرجاء إدخال كلمة بحث');
      return;
    }
    
    setLoading(true);
    try {
      const safeSearchParam = settings.safeSearch ? '&safeSearch=strict' : '';
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}${safeSearchParam}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'فشل البحث');
      }
      
      setVideos(data.videos || []);
      if (data.videos && data.videos.length > 0) {
        showSuccess('تم العثور على النتائج', `تم العثور على ${data.videos.length} فيديو`);
      } else {
        showError('لا توجد نتائج', 'لم يتم العثور على فيديوهات تطابق بحثك');
      }
    } catch (error) {
      console.error('Error searching videos:', error);
      showError('خطأ في البحث', error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const loadTrendingVideos = async () => {
    setLoading(true);
    try {
      const safeSearchParam = settings.safeSearch ? '?safeSearch=strict' : '';
      const response = await fetch(`/api/youtube/trending${safeSearchParam}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'فشل تحميل الفيديوهات');
      }
      
      setVideos(data.videos || []);
      if (data.videos && data.videos.length > 0) {
        showSuccess('تم تحميل الفيديوهات', `تم تحميل ${data.videos.length} فيديو شهير`);
      }
    } catch (error) {
      console.error('Error loading trending videos:', error);
      showError('خطأ في التحميل', error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const loadPopularVideos = async () => {
    setLoading(true);
    try {
      const safeSearchParam = settings.safeSearch ? '?safeSearch=strict' : '';
      const response = await fetch(`/api/youtube/popular${safeSearchParam}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'فشل تحميل الفيديوهات');
      }
      
      setVideos(data.videos || []);
      if (data.videos && data.videos.length > 0) {
        showSuccess('تم تحميل الفيديوهات', `تم تحميل ${data.videos.length} فيديو مشهور`);
      }
    } catch (error) {
      console.error('Error loading popular videos:', error);
      showError('خطأ في التحميل', error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedCategory('all');
    if (tab === 'trending') {
      loadTrendingVideos();
    } else if (tab === 'popular') {
      loadPopularVideos();
    } else {
      setVideos([]);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Here you could filter videos by category
    // For now, we'll just update the UI
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo and Menu */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <VideoIcon className="h-8 w-8 text-red-600" />
              <span className="text-xl font-bold">ماي يوتيوب</span>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="بحث في يوتيوب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <SettingsButton />
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 right-0 z-40 w-64 bg-background border-l transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="text-lg font-semibold">القائمة</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Navigation */}
            <nav className="space-y-2">
              <Button
                variant={activeTab === 'home' ? 'default' : 'ghost'}
                onClick={() => handleTabChange('home')}
                className="w-full justify-start"
              >
                <HomeIcon className="h-4 w-4 ml-2" />
                الرئيسية
              </Button>
              <Button
                variant={activeTab === 'trending' ? 'default' : 'ghost'}
                onClick={() => handleTabChange('trending')}
                className="w-full justify-start"
              >
                <TrendingUp className="h-4 w-4 ml-2" />
                الأكثر شيوعاً
              </Button>
              <Button
                variant={activeTab === 'popular' ? 'default' : 'ghost'}
                onClick={() => handleTabChange('popular')}
                className="w-full justify-start"
              >
                <VideoIcon className="h-4 w-4 ml-2" />
                الأشهر
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/channels'}
                className="w-full justify-start"
              >
                <Users className="h-4 w-4 ml-2" />
                القنوات
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/playlists'}
                className="w-full justify-start"
              >
                <Clock className="h-4 w-4 ml-2" />
                قوائم التشغيل
              </Button>
            </nav>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">المفضلة</h3>
              <nav className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Clock className="h-4 w-4 ml-2" />
                  سجل المشاهدة
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/channels'}
                >
                  <Users className="h-4 w-4 ml-2" />
                  القنوات المشتركة
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/playlists'}
                >
                  <Clock className="h-4 w-4 ml-2" />
                  قوائم التشغيل
                </Button>
              </nav>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Navigation Tabs */}
          <div className="border-b">
            <div className="container mx-auto px-4">
              <div className="flex space-x-1">
                <Button
                  variant={activeTab === 'home' ? 'default' : 'ghost'}
                  onClick={() => handleTabChange('home')}
                  className="flex items-center space-x-2"
                >
                  <HomeIcon className="h-4 w-4" />
                  <span>الرئيسية</span>
                </Button>
                <Button
                  variant={activeTab === 'trending' ? 'default' : 'ghost'}
                  onClick={() => handleTabChange('trending')}
                  className="flex items-center space-x-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>الأكثر شيوعاً</span>
                </Button>
                <Button
                  variant={activeTab === 'popular' ? 'default' : 'ghost'}
                  onClick={() => handleTabChange('popular')}
                  className="flex items-center space-x-2"
                >
                  <VideoIcon className="h-4 w-4" />
                  <span>الأشهر</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Categories */}
          {activeTab !== 'home' && (
            <div className="border-b bg-background/50 backdrop-blur">
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center space-x-2 overflow-x-auto">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleCategoryChange(category.id)}
                        className="flex items-center space-x-1 whitespace-nowrap"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{category.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Video Content */}
          <div className="container mx-auto px-4 py-6">
            {activeTab === 'home' && !videos.length && (
              <div className="text-center py-12">
                <div className="mb-8">
                  <VideoIcon className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-3xl font-bold mb-2">مرحباً بك في ماي يوتيوب</h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    ابحث عن فيديوهاتك المفضلة أو استكشف الأكثر شيوعاً والأشهر
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button 
                      onClick={() => handleTabChange('trending')}
                      className="flex items-center space-x-2"
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>استكشف الأكثر شيوعاً</span>
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleTabChange('popular')}
                      className="flex items-center space-x-2"
                    >
                      <VideoIcon className="h-4 w-4" />
                      <span>شاهد الأشهر</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <ResponsiveVideoGrid videos={[]} loading={true} />
            ) : (
              <ResponsiveVideoGrid videos={videos} />
            )}

            {!loading && videos.length === 0 && activeTab !== 'home' && (
              <div className="text-center py-12">
                <VideoIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">لا توجد فيديوهات متاحة</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}