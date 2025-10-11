'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Share, 
  ThumbsUp, 
  ThumbsDown, 
  Save, 
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings as SettingsIcon,
  Heart,
  Clock,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/settings-context';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
  duration?: string;
}

interface RelatedVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
  viewCount: string;
  publishedAt: string;
  duration?: string;
}

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.id as string;
  const { toast } = useToast();
  const { settings } = useSettings();
  
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (videoId) {
      fetchVideoData();
    }
  }, [videoId]);

  const fetchVideoData = async () => {
    setLoading(true);
    try {
      // Fetch video details (in a real app, this would be from your API)
      const mockVideo: Video = {
        id: videoId,
        title: 'فيديو تجريبي - تعلم البرمجة مع ماي يوتيوب',
        description: `هذا فيديو تجريبي يوضح كيفية استخدام منصة ماي يوتيوب لمشاهدة الفيديوهات التعليمية. 
        يغطي هذا الفيديو المواضيع التالية:
        • كيفية البحث عن الفيديوهات
        • استخدام الإعدادات المخصصة
        • إدارة القنوات المفضلة
        • مشاهدة الفيديوهات بجودة عالية
        
        شكراً لمشاهدتكم ونتمنى لكم تجربة ممتعة!`,
        thumbnailUrl: `https://picsum.photos/seed/${videoId}/1280/720.jpg`,
        channelTitle: 'قناة ماي يوتيوب التعليمية',
        publishedAt: '2024-01-15',
        viewCount: '15.2K',
        duration: '12:34'
      };

      const mockRelatedVideos: RelatedVideo[] = [
        {
          id: '1',
          title: 'مقدمة في البرمجة - الدرس الأول',
          thumbnailUrl: 'https://picsum.photos/seed/video1/320/180.jpg',
          channelTitle: 'قناة ماي يوتيوب التعليمية',
          viewCount: '8.5K',
          publishedAt: '2024-01-14',
          duration: '10:15'
        },
        {
          id: '2',
          title: 'أساسيات JavaScript للمبتدئين',
          thumbnailUrl: 'https://picsum.photos/seed/video2/320/180.jpg',
          channelTitle: 'قناة ماي يوتيوب التعليمية',
          viewCount: '12.3K',
          publishedAt: '2024-01-13',
          duration: '15:42'
        },
        {
          id: '3',
          title: 'كيفية تصميم واجهات مستخدم حديثة',
          thumbnailUrl: 'https://picsum.photos/seed/video3/320/180.jpg',
          channelTitle: 'قناة ماي يوتيوب التعليمية',
          viewCount: '6.7K',
          publishedAt: '2024-01-12',
          duration: '18:20'
        },
        {
          id: '4',
          title: 'أفضل ممارسات تطوير الويب',
          thumbnailUrl: 'https://picsum.photos/seed/video4/320/180.jpg',
          channelTitle: 'قناة ماي يوتيوب التعليمية',
          viewCount: '9.1K',
          publishedAt: '2024-01-11',
          duration: '14:56'
        }
      ];

      setVideo(mockVideo);
      setRelatedVideos(mockRelatedVideos);
    } catch (error) {
      console.error('Error fetching video data:', error);
      toast({
        title: 'خطأ في التحميل',
        description: 'فشل تحميل بيانات الفيديو',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = () => {
    if (userAction === 'like') {
      setLikeCount(likeCount - 1);
      setUserAction(null);
    } else {
      if (userAction === 'dislike') {
        setDislikeCount(dislikeCount - 1);
      }
      setLikeCount(likeCount + 1);
      setUserAction('like');
    }
  };

  const handleDislike = () => {
    if (userAction === 'dislike') {
      setDislikeCount(dislikeCount - 1);
      setUserAction(null);
    } else {
      if (userAction === 'like') {
        setLikeCount(likeCount - 1);
      }
      setDislikeCount(dislikeCount + 1);
      setUserAction('dislike');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'تم نسخ الرابط',
        description: 'تم نسخ رابط الفيديو إلى الحافظة'
      });
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
    toast({
      title: isSubscribed ? 'تم إلغاء الاشتراك' : 'تم الاشتراك',
      description: isSubscribed 
        ? 'تم إلغاء اشتراكك من القناة'
        : 'تم اشتراكك في القناة بنجاح'
    });
  };

  const handleBack = () => {
    router.back();
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">جاري تحميل الفيديو...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">الفيديو غير موجود</h1>
          <Button onClick={handleBack}>العودة إلى الرئيسية</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2 mr-4">
            <span className="text-lg font-semibold">مشاهدة الفيديو</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Main Video Section */}
        <div className="lg:w-2/3 p-4">
          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
            <iframe
              src={`https://www.youtube.com/embed/${video.id}?autoplay=${settings.autoplay ? '1' : '0'}&mute=${isMuted ? '1' : '0'}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={togglePlayPause}>
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <SettingsIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{video.viewCount} مشاهد</span>
                <span>•</span>
                <span>{video.publishedAt}</span>
                {video.duration && (
                  <>
                    <span>•</span>
                    <span>{video.duration}</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={userAction === 'like' ? 'default' : 'outline'}
                onClick={handleLike}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{likeCount > 0 ? likeCount : 'إعجاب'}</span>
              </Button>
              
              <Button
                variant={userAction === 'dislike' ? 'default' : 'outline'}
                onClick={handleDislike}
                className="flex items-center gap-2"
              >
                <ThumbsDown className="h-4 w-4" />
                <span>{dislikeCount > 0 ? dislikeCount : 'عدم إعجاب'}</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share className="h-4 w-4" />
                <span>مشاركة</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>حفظ</span>
              </Button>
              
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Channel Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{video.channelTitle.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{video.channelTitle}</h3>
                      <p className="text-sm text-muted-foreground">1.2M مشترك</p>
                    </div>
                  </div>
                  <Button 
                    variant={isSubscribed ? 'secondary' : 'default'}
                    onClick={handleSubscribe}
                  >
                    {isSubscribed ? 'مشترك' : 'اشتراك'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>الوصف</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {video.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-1/3 p-4 border-l">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">فيديوهات مقترحة</h3>
            
            {relatedVideos.map((relatedVideo) => (
              <Card key={relatedVideo.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="relative">
                      <img
                        src={relatedVideo.thumbnailUrl}
                        alt={relatedVideo.title}
                        className="w-40 h-24 object-cover rounded"
                      />
                      {relatedVideo.duration && (
                        <Badge variant="secondary" className="absolute bottom-1 right-1 text-xs">
                          {relatedVideo.duration}
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {relatedVideo.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-1">
                        {relatedVideo.channelTitle}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{relatedVideo.viewCount} مشاهد</span>
                        <span>•</span>
                        <span>{relatedVideo.publishedAt}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}