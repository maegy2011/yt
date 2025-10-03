'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Play, Clock } from 'lucide-react';
import Link from 'next/link';

interface Channel {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  addedAt: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  channelId: string;
  channelName?: string;
  channelThumbnail?: string;
}

export default function Home() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [channelsRes, videosRes] = await Promise.all([
        fetch('/api/channels'),
        fetch('/api/latest-videos')
      ]);

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        setChannels(channelsData);
      }

      if (videosRes.ok) {
        const videosData = await videosRes.json();
        setVideos(videosData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const results = await response.json();
        setVideos(results);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'اليوم';
    if (diffInDays === 1) return 'أمس';
    if (diffInDays < 7) return `منذ ${diffInDays} أيام`;
    if (diffInDays < 30) return `منذ ${Math.floor(diffInDays / 7)} أسابيع`;
    return `منذ ${Math.floor(diffInDays / 30)} أشهر`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-primary mb-2">
              اليوتيوب الإسلامي
            </h1>
            <p className="text-muted-foreground text-lg">
              بوابتك الآمنة للمعرفة الإسلامية
            </p>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="ابحث عن فيديوهات إسلامية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={searchLoading}>
                <Search className="h-4 w-4 ml-2" />
                {searchLoading ? 'جاري البحث...' : 'بحث'}
              </Button>
            </div>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Featured Channels */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">القنوات المميزة</h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="w-20 h-20 mx-auto mb-2 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : channels.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {channels.map((channel) => (
                <Link key={channel.id} href={`/channel/${channel.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                    <CardContent className="p-4">
                      {channel.thumbnailUrl ? (
                        <img
                          src={channel.thumbnailUrl}
                          alt={channel.name}
                          className="w-20 h-20 mx-auto mb-2 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                          <Play className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <h3 className="font-semibold text-sm truncate">{channel.name}</h3>
                      {channel.category && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {channel.category}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                لم يتم إضافة أي قنوات بعد
              </CardContent>
            </Card>
          )}
        </section>

        {/* Latest Videos */}
        <section>
          <h2 className="text-2xl font-bold mb-6">أحدث الفيديوهات</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="aspect-video w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <Link key={video.id} href={`/video/${video.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                    <div className="relative">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2">{video.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {video.channelName || video.channelTitle}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 ml-1" />
                        {formatDate(video.publishedAt)}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                لا توجد فيديوهات متاحة
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}