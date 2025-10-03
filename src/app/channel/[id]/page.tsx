'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Play, Clock, Users } from 'lucide-react';
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
}

export default function ChannelPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.id as string;
  
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (channelId) {
      fetchChannelData();
    }
  }, [channelId]);

  const fetchChannelData = async () => {
    try {
      setLoading(true);
      
      // Fetch channel info from our database
      const channelsRes = await fetch('/api/channels');
      if (channelsRes.ok) {
        const channels: Channel[] = await channelsRes.json();
        const channelData = channels.find(c => c.id === channelId);
        setChannel(channelData || null);
      }

      // Fetch videos from YouTube API
      const videosRes = await fetch(`/api/videos?channelId=${channelId}`);
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        setVideos(videosData);
      }
    } catch (error) {
      console.error('Error fetching channel data:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
            </div>
          </div>
          
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
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">القناة غير موجودة</h2>
            <p className="text-muted-foreground mb-4">
              لم يتم العثور على القناة المطلوبة
            </p>
            <Button onClick={() => router.push('/')}>
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Channel Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="flex-shrink-0">
              {channel.thumbnailUrl ? (
                <img
                  src={channel.thumbnailUrl}
                  alt={channel.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{channel.name}</h1>
              {channel.description && (
                <p className="text-muted-foreground mb-3 max-w-2xl">
                  {channel.description}
                </p>
              )}
              <div className="flex items-center gap-3">
                {channel.category && (
                  <Badge variant="secondary">{channel.category}</Badge>
                )}
                <Button asChild>
                  <Link href="/">
                    <ArrowRight className="h-4 w-4 ml-2" />
                    العودة للصفحة الرئيسية
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Videos Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">فيديوهات القناة</h2>
          <p className="text-muted-foreground">
            {videos.length} فيديو
          </p>
        </div>

        {videos.length > 0 ? (
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
              لا توجد فيديوهات متاحة لهذه القناة
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}