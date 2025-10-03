'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, ExternalLink, Clock, Eye, Play } from 'lucide-react';
import Link from 'next/link';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  channelId: string;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  addedAt: string;
}

export default function VideoPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.id as string;
  
  const [video, setVideo] = useState<Video | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (videoId) {
      fetchVideoData();
    }
  }, [videoId]);

  const fetchVideoData = async () => {
    try {
      setLoading(true);
      
      // Get all channels to find which one this video belongs to
      const channelsRes = await fetch('/api/channels');
      if (channelsRes.ok) {
        const channels: Channel[] = await channelsRes.json();
        
        // For demo videos, create mock video object
        if (videoId.startsWith('demo_')) {
          const mockVideo: Video = {
            id: videoId,
            title: 'فيديو تجريبي إسلامي',
            description: 'هذا فيديو تجريبي لعرض كيفية عمل تطبيق اليوتيوب الإسلامي. التطبيق يوفر بيئة آمنة لمشاهدة المحتوى الإسلامي المعتمد فقط.',
            thumbnailUrl: `https://picsum.photos/seed/${videoId}/640/360.jpg`,
            channelTitle: 'قناة إسلامية معتمدة',
            publishedAt: new Date().toISOString(),
            channelId: channels[0]?.id || ''
          };
          
          setVideo(mockVideo);
          
          // Find the channel
          const channelData = channels.find(c => c.id === mockVideo.channelId);
          setChannel(channelData || null);
        } else {
          // For real YouTube videos, we would fetch from YouTube API
          // For now, create a mock video object
          const mockVideo: Video = {
            id: videoId,
            title: 'فيديو إسلامي',
            description: 'وصف الفيديو الإسلامي',
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            channelTitle: 'قناة إسلامية',
            publishedAt: new Date().toISOString(),
            channelId: channels[0]?.id || ''
          };
          
          setVideo(mockVideo);
          
          // Find the channel
          const channelData = channels.find(c => c.id === mockVideo.channelId);
          setChannel(channelData || null);
        }
      }
    } catch (error) {
      console.error('Error fetching video data:', error);
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div>
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">الفيديو غير موجود</h2>
            <p className="text-muted-foreground mb-4">
              لم يتم العثور على الفيديو المطلوب
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
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden">
              {videoId.startsWith('demo_') ? (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-semibold mb-2">فيديو تجريبي</p>
                    <p className="text-sm text-gray-300">
                      هذا فيديو تجريبي لعرض كيفية عمل التطبيق
                    </p>
                  </div>
                </div>
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={video.title}
                />
              )}
            </div>

            {/* Video Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">{video.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 ml-1" />
                    {formatDate(video.publishedAt)}
                  </div>
                  {channel && (
                    <Link href={`/channel/${channel.id}`}>
                      <Badge variant="secondary" className="hover:bg-primary/20 cursor-pointer">
                        {channel.name}
                      </Badge>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {video.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {video.description}
                  </p>
                )}
                
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline">
                    <a
                      href={`https://www.youtube.com/watch?v=${videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 ml-2" />
                      مشاهدة على يوتيوب
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline">
                    <Link href="/">
                      <ArrowRight className="h-4 w-4 ml-2" />
                      العودة للصفحة الرئيسية
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            {channel && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">حول القناة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-3">
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
                    <div>
                      <h3 className="font-semibold">{channel.name}</h3>
                      {channel.category && (
                        <Badge variant="secondary" className="text-xs">
                          {channel.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {channel.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {channel.description.length > 150
                        ? `${channel.description.substring(0, 150)}...`
                        : channel.description}
                    </p>
                  )}
                  
                  <Button asChild className="w-full">
                    <Link href={`/channel/${channel.id}`}>
                      عرض جميع الفيديوهات
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Related Videos Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">فيديوهات مقترحة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  سيتم عرض فيديوهات مقترحة من نفس القناة هنا
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}