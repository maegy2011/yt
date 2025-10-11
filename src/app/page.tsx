'use client';

import { useState } from 'react';
import { Search, Video as VideoIcon, TrendingUp, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VideoGrid } from '@/components/video/video-card';
import { VideoPlayerModal } from '@/components/video/video-player-modal';
import { useApiToast } from '@/hooks/use-api-toast';

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
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const { showError, showSuccess } = useApiToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showError('الرجاء إدخال كلمة بحث');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);
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
      const response = await fetch('/api/youtube/trending');
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
      const response = await fetch('/api/youtube/popular');
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
    if (tab === 'trending') {
      loadTrendingVideos();
    } else if (tab === 'popular') {
      loadPopularVideos();
    } else {
      setVideos([]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <VideoIcon className="h-8 w-8 text-red-600" />
              <span className="text-xl font-bold">ماي يوتيوب</span>
            </div>
          </div>
          
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
        </div>
      </header>

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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'home' && !videos.length && (
          <div className="text-center py-12">
            <VideoIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">مرحباً بك في ماي يوتيوب</h2>
            <p className="text-muted-foreground mb-4">
              ابحث عن فيديوهاتك المفضلة أو استكشف الأكثر شيوعاً والأشهر
            </p>
          </div>
        )}

        {loading ? (
          <VideoGrid videos={[]} loading={true} />
        ) : (
          <VideoGrid 
            videos={videos} 
            onVideoClick={(video) => {
              setSelectedVideo(video);
              setIsPlayerOpen(true);
            }}
          />
        )}

        {!loading && videos.length === 0 && activeTab !== 'home' && (
          <div className="text-center py-12">
            <VideoIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">لا توجد فيديوهات متاحة</p>
          </div>
        )}
      </main>

      <VideoPlayerModal
        video={selectedVideo}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />
    </div>
  );
}