"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Star, Settings, Plus, Trash2, Edit, ExternalLink, BarChart3, Database, RefreshCw, Video, Play, Loader2, Youtube, Home, BookOpen, Heart, Users, Film, FileText, Share2, Menu, Share, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import { LoadingSpinner, LoadingOverlay, LoadingCard } from "@/components/ui/loading-spinner";
import { NotesManager } from "@/components/notes-manager";
import { EnhancedNotesManager } from "@/components/enhanced-notes-manager";
import { VideoSyncNotes } from "@/components/video-sync-notes";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
}

interface Channel {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  subscriberCount: string;
  videoCount: string;
}

interface Note {
  id: string;
  videoId: string;
  videoTitle: string;
  channelTitle: string;
  channelThumbnail: string;
  content: string;
  timestamp?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function VideoPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params.id as string;
  const { toast } = useToast();
  
  // Debug: Log the video ID
  console.log("Video ID:", videoId);
  
  const [video, setVideo] = useState<Video | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [watchedVideos, setWatchedVideos] = useState<any[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<any[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("جاري تحميل الفيديو...");
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [followedChannels, setFollowedChannels] = useState<Channel[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Load data from localStorage on component mount
  useEffect(() => {
    console.log("useEffect running, videoId:", videoId);
    
    // Enhanced dynamic loading messages with stages
    const loadingStages = [
      { message: "جاري تحميل الصفحة...", duration: 800 },
      { message: "جاري استرجاع بيانات الفيديو...", duration: 600 },
      { message: "جاري تحميل معلومات القناة...", duration: 500 },
      { message: "جاري تجهيز المشغل...", duration: 400 },
      { message: "جاري تحميل الفيديوهات ذات صلة...", duration: 300 },
      { message: "أخيراً، جاري التشغيل...", duration: 200 }
    ];
    
    let currentStage = 0;
    
    const loadNextStage = () => {
      if (currentStage < loadingStages.length) {
        setLoadingMessage(loadingStages[currentStage].message);
        
        setTimeout(() => {
          currentStage++;
          loadNextStage();
        }, loadingStages[currentStage].duration);
      } else {
        // All loading stages complete
        setIsPageLoading(false);
        setIsPlayerLoading(false);
        setIsVideoLoading(false);
      }
    };
    
    // Start loading process
    loadNextStage();
    
    const savedChannels = localStorage.getItem("youtubeChannels");
    const savedWatched = localStorage.getItem("watchedVideos");
    const savedFavorites = localStorage.getItem("favoriteVideos");
    const savedNotes = localStorage.getItem("notes");
    const savedCache = localStorage.getItem("cacheData");
    const savedFollowedChannels = localStorage.getItem("followedChannels");
    const savedNotifications = localStorage.getItem("notifications");

    console.log("savedCache:", savedCache);

    if (savedChannels) setChannels(JSON.parse(savedChannels));
    if (savedWatched) setWatchedVideos(JSON.parse(savedWatched));
    if (savedFavorites) setFavoriteVideos(JSON.parse(savedFavorites));
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedFollowedChannels) setFollowedChannels(JSON.parse(savedFollowedChannels));
    if (savedNotifications) {
      const notifs = JSON.parse(savedNotifications);
      setNotifications(notifs);
      setUnreadNotifications(notifs.filter((n: any) => !n.read).length);
    }

    if (savedCache) {
      const cache = JSON.parse(savedCache);
      console.log("Cache videos count:", cache.videos?.length || 0);
      
      // Find the video from cache
      const foundVideo = cache.videos.find((v: Video) => v.id === videoId);
      console.log("Found video:", foundVideo);
      
      if (foundVideo) {
        setVideo(foundVideo);
        setCurrentVideo(foundVideo);
        
        // Find related videos from same channel
        const related = cache.videos
          .filter((v: Video) => v.channelId === foundVideo.channelId && v.id !== foundVideo.id)
          .slice(0, 6);
        setRelatedVideos(related);
        console.log("Related videos:", related.length);
      } else {
        console.log("Video not found in cache");
      }
    } else {
      console.log("No cache found");
    }
  }, [videoId]);

  const getChannelInfo = (channelId: string) => {
    return channels.find(c => c.id === channelId);
  };

  const isChannelFollowed = (channelId: string) => {
    return followedChannels.some(c => c.id === channelId);
  };

  const followChannel = (channel: Channel) => {
    if (!isChannelFollowed(channel.id)) {
      setFollowedChannels(prev => [...prev, channel]);
      localStorage.setItem("followedChannels", JSON.stringify([...followedChannels, channel]));
      toast({
        title: "نجاح",
        description: `تم متابعة قناة ${channel.title} بنجاح`,
      });
    }
  };

  const unfollowChannel = (channelId: string) => {
    const channel = followedChannels.find(c => c.id === channelId);
    setFollowedChannels(prev => prev.filter(c => c.id !== channelId));
    localStorage.setItem("followedChannels", JSON.stringify(followedChannels.filter(c => c.id !== channelId)));
    toast({
      title: "نجاح",
      description: `تم إلغاء متابعة قناة ${channel?.title} بنجاح`,
    });
  };

  const addNotification = (notification: any) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false
    };
    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    setUnreadNotifications(updatedNotifications.filter(n => !n.read).length);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
  };

  const markNotificationAsRead = (id: string) => {
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    setUnreadNotifications(updatedNotifications.filter(n => !n.read).length);
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadNotifications(0);
    localStorage.setItem("notifications", JSON.stringify([]));
  };

  // Simulate RSS feed checking for new videos
  const checkForNewVideos = () => {
    followedChannels.forEach(channel => {
      // Simulate finding a new video (in real app, this would check RSS feeds)
      if (Math.random() > 0.8) { // 20% chance to find new video
        addNotification({
          type: 'new_video',
          title: 'فيديو جديد',
          message: `${channel.title} نشر فيديو جديداً`,
          channel: channel,
          video: {
            id: `simulated_${Date.now()}`,
            title: `فيديو جديد من ${channel.title}`,
            thumbnail: channel.thumbnail
          }
        });
      }
    });
  };

  // Check for new videos every 30 seconds (for demo)
  useEffect(() => {
    const interval = setInterval(() => {
      if (followedChannels.length > 0) {
        checkForNewVideos();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [followedChannels]);

  const addToWatched = (video: Video) => {
    const alreadyWatched = watchedVideos.some(v => v.id === video.id);
    if (!alreadyWatched) {
      const watchedVideo = {
        ...video,
        watchedAt: new Date().toISOString(),
      };
      setWatchedVideos(prev => [watchedVideo, ...prev]);
      localStorage.setItem("watchedVideos", JSON.stringify(watchedVideos));
    }
  };

  const addToFavorites = (video: Video) => {
    const alreadyFavorited = favoriteVideos.some(v => v.id === video.id);
    if (!alreadyFavorited) {
      const favoriteVideo = {
        ...video,
        favoritedAt: new Date().toISOString(),
      };
      setFavoriteVideos(prev => [favoriteVideo, ...prev]);
      localStorage.setItem("favoriteVideos", JSON.stringify(favoriteVideos));
      toast({
        title: "تمت الإضافة",
        description: "تمت إضافة الفيديو إلى المفضلة",
      });
    }
  };

  const removeFromFavorites = (videoId: string) => {
    setFavoriteVideos(prev => prev.filter(v => v.id !== videoId));
    localStorage.setItem("favoriteVideos", JSON.stringify(favoriteVideos));
    toast({
      title: "تم الحذف",
      description: "تم حذف الفيديو من المفضلة",
    });
  };

  const goBack = () => {
    router.push("/");
  };

  const playRelatedVideo = (relatedVideo: Video) => {
    router.push(`/video/${relatedVideo.id}`);
  };

  const shareVideo = async () => {
    if (!video) return;

    const shareData = {
      title: video.title,
      text: `شاهد هذا الفيديو التعليمي: ${video.title}`,
      url: window.location.href,
    };

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: "نجاح",
          description: "تم مشاركة الفيديو بنجاح",
        });
      } catch (error) {
        console.log("Share cancelled:", error);
        // Fallback to copy to clipboard
        copyToClipboard();
      }
    } else {
      // Fallback to copy to clipboard
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    if (!video) return;

    const shareText = `${video.title}\n\n${window.location.href}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        toast({
          title: "نجاح",
          description: "تم نسخ رابط الفيديو إلى الحافظة",
        });
      }).catch(() => {
        fallbackCopyTextToClipboard(shareText);
      });
    } else {
      fallbackCopyTextToClipboard(shareText);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      toast({
        title: "نجاح",
        description: "تم نسخ رابط الفيديو إلى الحافظة",
      });
    } catch (err) {
      toast({
        title: "خطأ",
        description: "فشل نسخ الرابط، يرجى المحاولة يدوياً",
        variant: "destructive",
      });
    }
    
    document.body.removeChild(textArea);
  };

  const VideoCard = ({ video, onPlay, onFavorite, onShare }: { 
    video: Video; 
    onPlay: () => void;
    onFavorite: () => void;
    onShare: () => void;
  }) => {
    const channelInfo = getChannelInfo(video.channelId);
    
    return (
      <Card 
        className="group cursor-pointer w-full overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        onClick={onPlay}
      >
        <CardContent className="p-0">
          <div className="relative overflow-hidden bg-gray-100 aspect-video">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {/* YouTube-style duration badge */}
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-2 py-1 rounded backdrop-blur-sm border border-white/10">
              {video.duration}
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
                <Play className="w-6 h-6 text-white ml-0.5" />
              </div>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                  {video.title}
                </h3>
                <div className="flex items-center gap-1">
                  {channelInfo && (
                    <img 
                      src={channelInfo.thumbnail} 
                      alt={channelInfo.title}
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full object-cover"
                    />
                  )}
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 flex items-center">
                    {video.channelTitle}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 sm:gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavorite();
                  }}
                  className={`h-7 w-7 sm:h-8 sm:w-8 transition-all duration-200 ${
                    favoriteVideos.some(f => f.id === video.id) 
                      ? 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100' 
                      : 'hover:bg-gray-50 hover:text-gray-600'
                  }`}
                >
                  <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${favoriteVideos.some(f => f.id === video.id) ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                  }}
                  className="h-7 w-7 sm:h-8 sm:w-8 transition-all duration-200 hover:bg-gray-50 hover:text-gray-600"
                >
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">الفيديو غير موجود</h2>
          <p className="text-gray-600 mb-6">
            لم يتم العثور على الفيديو المطلوب. يرجى التحقق من أن الفيديو متاح في الكاش أو العودة إلى الصفحة الرئيسية.
          </p>
          <Button onClick={goBack} className="bg-red-600 hover:bg-red-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة للصفحة الرئيسية
          </Button>
        </div>
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Youtube className="w-8 h-8 text-white" />
          </div>
          <LoadingSpinner size="lg" text={loadingMessage} />
        </div>
      </div>
    );
  }

  const channelInfo = getChannelInfo(video.channelId);

  return (
    <div className="min-h-screen bg-gray-50">
      <LoadingOverlay isLoading={isVideoLoading} text="جاري تحميل الفيديو..." />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8 sm:h-10 sm:w-10">
              <ArrowLeft className="w-4 h-4 sm:w-6 sm:h-6" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  <Menu className="w-4 h-4 sm:w-6 sm:h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Youtube className="w-8 h-8 text-red-600" />
                    <h2 className="text-xl font-bold">المنصة التعليمية</h2>
                  </div>
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={goBack}>
                      <Home className="w-4 h-4 mr-2" />
                      الصفحة الرئيسية
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/')}>
                      <Film className="w-4 h-4 mr-2" />
                      الفيديوهات
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/?tab=notes')}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      الملاحظات
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/?tab=favorites')}>
                      <Heart className="w-4 h-4 mr-2" />
                      المفضلة
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      القنوات المتابعة
                      {followedChannels.length > 0 && (
                        <Badge variant="secondary" className="mr-auto">
                          {followedChannels.length}
                        </Badge>
                      )}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Bell className="w-4 h-4 mr-2" />
                          الإشعارات
                          {unreadNotifications > 0 && (
                            <Badge variant="destructive" className="mr-auto">
                              {unreadNotifications}
                            </Badge>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            الإشعارات
                            {unreadNotifications > 0 && (
                              <Badge variant="destructive">
                                {unreadNotifications}
                              </Badge>
                            )}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {notifications.length === 0 ? (
                            <div className="text-center py-8">
                              <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                              <p className="text-gray-500">لا توجد إشعارات جديدة</p>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  {unreadNotifications} غير مقروء
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={clearAllNotifications}
                                >
                                  مسح الكل
                                </Button>
                              </div>
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {notifications.map((notification) => (
                                  <Card 
                                    key={notification.id} 
                                    className={`p-3 cursor-pointer transition-colors ${
                                      notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                                    }`}
                                    onClick={() => markNotificationAsRead(notification.id)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0">
                                        {notification.type === 'new_video' ? (
                                          <Video className="w-5 h-5 text-red-600" />
                                        ) : (
                                          <Bell className="w-5 h-5 text-blue-600" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm">
                                          {notification.title}
                                        </h4>
                                        <p className="text-xs text-gray-600 mt-1">
                                          {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                          {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                      </div>
                                      {!notification.read && (
                                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                      )}
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex items-center gap-2">
            <Youtube className="w-6 h-6 text-red-600" />
            <h1 className="text-lg sm:text-xl font-bold">المنصة التعليمية</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-2 sm:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative bg-black aspect-video">
                  {isVideoLoading ? (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                      <LoadingSpinner size="lg" text={loadingMessage} />
                    </div>
                  ) : (
                    <LiteYouTubeEmbed
                      id={video.id}
                      title={video.title}
                      params="rel=0&modestbranding=1&showinfo=0&controls=1&autoplay=1&playsinline=1"
                      poster="maxresdefault"
                      wrapperClass="yt-lite w-full h-full"
                      playerClass="lty-playbtn"
                      iframeClass=""
                      adNetwork={false}
                      activatedClass="yt-lite-activated"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Video Info */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Youtube className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                        {video.title}
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-2">
                          {channelInfo && (
                            <img 
                              src={channelInfo.thumbnail} 
                              alt={channelInfo.title}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          )}
                          <span>{video.channelTitle}</span>
                        </div>
                        <span>•</span>
                        <span>{video.duration}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => addToFavorites(video)}
                      className={`flex-1 transition-all duration-200 ${
                        favoriteVideos.some(f => f.id === video.id) 
                          ? 'bg-yellow-600 hover:bg-yellow-700' 
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${favoriteVideos.some(f => f.id === video.id) ? 'fill-current' : ''}`} />
                      {favoriteVideos.some(f => f.id === video.id) ? 'في المفضلة' : 'إضافة للمفضلة'}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={shareVideo}>
                      <Share2 className="w-4 h-4 mr-2" />
                      مشاركة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold">ملاحظات الفيديو</h2>
                </div>
                <VideoSyncNotes 
                  videoId={video.id}
                  videoTitle={video.title}
                  videoUrl={`https://www.youtube.com/watch?v=${video.id}`}
                  notes={notes.filter(note => note.videoId === video.id).map(note => ({
                    ...note,
                    type: 'note' as const,
                    timestamp: note.timestamp || 0
                  }))}
                  onAddNote={(noteData) => {
                    const newNote: Note = {
                      id: Date.now().toString(), // Generate a simple ID
                      videoId: video.id,
                      videoTitle: video.title,
                      channelTitle: video.channelTitle,
                      channelThumbnail: video.thumbnail,
                      content: noteData.content,
                      timestamp: noteData.timestamp,
                      tags: noteData.tags,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    };
                    setNotes(prev => [...prev, newNote]);
                  }}
                  onUpdateNote={(id, updateData) => {
                    setNotes(prev => prev.map(note => 
                      note.id === id ? { ...note, ...updateData, updatedAt: new Date().toISOString() } : note
                    ));
                  }}
                  onDeleteNote={(id) => {
                    setNotes(prev => prev.filter(note => note.id !== id));
                  }}
                  onShareNote={(note) => {
                    // Share logic here
                    console.log('Sharing note:', note);
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Channel Info */}
            {channelInfo && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={channelInfo.thumbnail}
                      alt={channelInfo.title}
                      className="w-12 h-12 rounded-full object-contain"
                    />
                    <div>
                      <h3 className="font-semibold">{channelInfo.title}</h3>
                      <p className="text-sm text-gray-600">
                        {channelInfo.subscriberCount} مشترك
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant={isChannelFollowed(channelInfo.id) ? "default" : "outline"} 
                    className={`w-full ${isChannelFollowed(channelInfo.id) ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    onClick={() => {
                      if (isChannelFollowed(channelInfo.id)) {
                        unfollowChannel(channelInfo.id);
                      } else {
                        followChannel(channelInfo);
                      }
                    }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {isChannelFollowed(channelInfo.id) ? 'متابع' : 'متابعة القناة'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Related Videos */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Video className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">فيديوهات ذات صلة</h2>
                </div>
                <div className="space-y-3">
                  {relatedVideos.length > 0 ? (
                    relatedVideos.map((relatedVideo) => (
                      <VideoCard
                        key={relatedVideo.id}
                        video={relatedVideo}
                        onPlay={() => playRelatedVideo(relatedVideo)}
                        onFavorite={() => addToFavorites(relatedVideo)}
                        onShare={() => {}}
                      />
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">لا توجد فيديوهات ذات صلة</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}