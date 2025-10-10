"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Menu, Grid, List, Clock, Settings, Plus, Trash2, BarChart3, Database, RefreshCw, Video, Play, Loader2, Youtube, BookOpen, Heart, Film, FileText, Share2 } from "lucide-react";
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
import { RobustYouTubePlayer } from "@/components/robust-youtube-player";
import { LoadingSpinner, LoadingOverlay, LoadingCard } from "@/components/ui/loading-spinner";
import { NotesManager } from "@/components/notes-manager";
import { EnhancedNotesManager } from "@/components/enhanced-notes-manager";
import { VideoSyncNotes } from "@/components/video-sync-notes";
import { HadithSearch } from "@/components/hadith-search";
import { YouTubeAPITest } from "@/components/youtube-api-test";
import { 
  youtubeApiTracker, 
  trackChannelListCall, 
  trackVideoListCall, 
  canMakeChannelListCall, 
  canMakeVideoListCall,
  YOUTUBE_API_QUOTA_COSTS,
  type QuotaUsage
} from "@/lib/youtube-api";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
}

interface WatchedVideo extends Video {
  watchedAt: string;
}

interface FavoriteVideo extends Video {
  favoritedAt: string;
  notes?: string;
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

interface CacheData {
  videos: Video[];
  channels: Channel[];
  lastUpdated: string;
  apiCalls: number;
  quotaRemaining: number;
}

export default function Home() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [watchedVideos, setWatchedVideos] = useState<WatchedVideo[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<FavoriteVideo[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelInput, setChannelInput] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [isChannelManagerOpen, setIsChannelManagerOpen] = useState(false);
  const [isFetchingChannelInfo, setIsFetchingChannelInfo] = useState(false);
  const [apiQuota, setApiQuota] = useState(10000); // Default YouTube API quota
  const [apiCalls, setApiCalls] = useState(0);
  const [quotaUsage, setQuotaUsage] = useState<QuotaUsage | null>(null);
  const [cacheData, setCacheData] = useState<CacheData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videosPerPage, setVideosPerPage] = useState(10); // Default videos per channel
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const { toast } = useToast();

  // Load data from localStorage on component mount
  useEffect(() => {
    const initializeApp = async () => {
      setIsAppLoading(true);
      
      const savedApiKey = localStorage.getItem("youtubeApiKey");
      const savedChannels = localStorage.getItem("youtubeChannels");
      const savedWatched = localStorage.getItem("watchedVideos");
      const savedFavorites = localStorage.getItem("favoriteVideos");
      const savedNotes = localStorage.getItem("notes");
      const savedCache = localStorage.getItem("cacheData");
      const savedApiCalls = localStorage.getItem("apiCalls");
      const savedVideosPerPage = localStorage.getItem("videosPerPage");

      if (savedApiKey) setApiKey(savedApiKey);
      if (savedChannels) setChannels(JSON.parse(savedChannels));
      if (savedWatched) setWatchedVideos(JSON.parse(savedWatched));
      if (savedFavorites) setFavoriteVideos(JSON.parse(savedFavorites));
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      if (savedCache) {
        const cache = JSON.parse(savedCache);
        setCacheData(cache);
        setVideos(cache.videos);
        setFilteredVideos(cache.videos);
      }
      if (savedApiCalls) setApiCalls(parseInt(savedApiCalls));
      if (savedVideosPerPage) setVideosPerPage(parseInt(savedVideosPerPage));

      // Initialize quota tracker
      const usage = youtubeApiTracker.getQuotaUsage();
      setQuotaUsage(usage);
      setApiQuota(usage.dailyQuota);
      setApiCalls(usage.totalCalls);

      // Check if mobile
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      
      // Simulate app loading
      setTimeout(() => setIsAppLoading(false), 1000);
      
      return () => window.removeEventListener('resize', handleResize);
    };

    initializeApp();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("youtubeChannels", JSON.stringify(channels));
  }, [channels]);

  // Update quota usage when it changes
  useEffect(() => {
    const usage = youtubeApiTracker.getQuotaUsage();
    setQuotaUsage(usage);
    setApiCalls(usage.totalCalls);
  }, [apiCalls]);

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // Update cache when videos change
  useEffect(() => {
    if (videos.length > 0) {
      const newCache: CacheData = {
        videos,
        channels,
        lastUpdated: new Date().toISOString(),
        apiCalls,
        quotaRemaining: apiQuota - apiCalls
      };
      setCacheData(newCache);
      localStorage.setItem("cacheData", JSON.stringify(newCache));
    }
  }, [videos, channels, apiCalls, apiQuota]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("watchedVideos", JSON.stringify(watchedVideos));
  }, [watchedVideos]);

  useEffect(() => {
    localStorage.setItem("favoriteVideos", JSON.stringify(favoriteVideos));
  }, [favoriteVideos]);

  // Filter videos based on search query and channels
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVideos(videos);
    } else {
      const filtered = videos.filter(video =>
        (video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         video.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())) &&
        channels.some(channel => channel.id === video.channelId)
      );
      setFilteredVideos(filtered);
    }
  }, [searchQuery, videos, channels]);

  const saveSettings = () => {
    localStorage.setItem("youtubeApiKey", apiKey);
    localStorage.setItem("videosPerPage", videosPerPage.toString());
    // Update quota tracker with new daily quota
    youtubeApiTracker.setDailyQuota(apiQuota);
    toast({
      title: "تم الحفظ",
      description: "تم حفظ الإعدادات بنجاح",
    });
  };

  const resetQuotaTracking = () => {
    youtubeApiTracker.reset();
    const usage = youtubeApiTracker.getQuotaUsage();
    setQuotaUsage(usage);
    setApiCalls(usage.totalCalls);
    toast({
      title: "تم إعادة التعيين",
      description: "تم إعادة تعيين تتبع حصة API",
    });
  };

  const fetchChannelInfo = async (channelId: string) => {
    if (!apiKey) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مفتاح API أولاً",
        variant: "destructive",
      });
      return null;
    }

    // Check API quota using new tracker
    if (!canMakeChannelListCall(100)) {
      const warning = youtubeApiTracker.getQuotaWarning();
      toast({
        title: "خطأ",
        description: warning || "حصة API غير كافية. يرجى استخدام مفتاح جديد غداً.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=snippet,statistics`
      );
      const data = await response.json();

      if (data.items && data.items[0]) {
        const channel = data.items[0];
        trackChannelListCall(true); // Track successful call
        return {
          id: channel.id,
          title: channel.snippet.title,
          thumbnail: channel.snippet.thumbnails.high.url,
          description: channel.snippet.description,
          subscriberCount: parseInt(channel.statistics.subscriberCount).toLocaleString(),
          videoCount: parseInt(channel.statistics.videoCount).toLocaleString(),
        };
      } else {
        trackChannelListCall(false, "No channel items found");
        return null;
      }
    } catch (error) {
      trackChannelListCall(false, error instanceof Error ? error.message : "Unknown error");
      toast({
        title: "خطأ",
        description: "فشل جلب معلومات القناة",
        variant: "destructive",
      });
      return null;
    }
  };

  const addChannel = async () => {
    if (!channelInput.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال معرف القناة",
        variant: "destructive",
      });
      return;
    }

    const channelId = channelInput.trim();
    
    // Check if channel already exists
    if (channels.some(c => c.id === channelId)) {
      toast({
        title: "خطأ",
        description: "القناة موجودة بالفعل",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingChannelInfo(true);
    const channelInfo = await fetchChannelInfo(channelId);
    setIsFetchingChannelInfo(false);

    if (channelInfo) {
      setChannels(prev => [...prev, channelInfo]);
      setChannelInput("");
      toast({
        title: "نجاح",
        description: `تمت إضافة قناة ${channelInfo.title} بنجاح`,
      });
    }
  };

  const removeChannel = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    setChannels(prev => prev.filter(c => c.id !== channelId));
    toast({
      title: "تم الحذف",
      description: `تم حذف قناة ${channel?.title} بنجاح`,
    });
  };

  const fetchVideos = async (loadMore = false) => {
    if (!apiKey || channels.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مفتاح API وإضافة قنوات يوتيوب",
        variant: "destructive",
      });
      return;
    }

    // Check API quota using new tracker
    const estimatedCalls = channels.length;
    if (!canMakeVideoListCall(estimatedCalls * 2)) {
      const warning = youtubeApiTracker.getQuotaWarning();
      toast({
        title: "خطأ",
        description: warning || `حصة API غير كافية لجلب فيديوهات من ${channels.length} قنوات.`,
        variant: "destructive",
      });
      return;
    }

    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const allVideos: Video[] = loadMore ? [...videos] : [];
      let successfulFetches = 0;

      for (const channel of channels) {
        try {
          // Use search.list endpoint with channelId parameter
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channel.id}&part=snippet&type=video&maxResults=${videosPerPage}&order=date`
          );
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
          }
          
          const data = await response.json();

          if (data.items && data.items.length > 0) {
            trackVideoListCall(true); // Track successful call
            successfulFetches++;
            
            // Extract video IDs and get detailed information
            const videoIds = data.items.map((item: any) => item.id.videoId).filter(Boolean);
            
            if (videoIds.length > 0) {
              // Get video details including duration
              const detailsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds.join(',')}&part=snippet,contentDetails`
              );
              
              if (!detailsResponse.ok) {
                const errorData = await detailsResponse.json();
                throw new Error(errorData.error?.message || `HTTP ${detailsResponse.status}`);
              }
              
              const detailsData = await detailsResponse.json();
              
              if (detailsData.items) {
                const videosWithDetails = detailsData.items.map((item: any) => {
                  const duration = item.contentDetails?.duration;
                  let formattedDuration = "0:00";
                  
                  if (duration) {
                    const minutes = Math.floor(parseInt(duration.match(/(\d+)M/)?.[1] || 0));
                    const seconds = Math.floor(parseInt(duration.match(/(\d+)S/)?.[1] || 0));
                    formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                  }

                  return {
                    id: item.id,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
                    duration: formattedDuration,
                    channelTitle: item.snippet.channelTitle,
                    channelId: item.snippet.channelId,
                    publishedAt: item.snippet.publishedAt,
                  };
                }).filter((video: Video | null): video is Video => video !== null);

                allVideos.push(...videosWithDetails);
              }
            }
          } else {
            trackVideoListCall(false, "No video items found");
          }
        } catch (error) {
          trackVideoListCall(false, error instanceof Error ? error.message : "Unknown error");
          console.error(`Error fetching videos for channel ${channel.id}:`, error);
          
          // Show specific error messages
          let errorMessage = "فشل جلب الفيديوهات";
          if (error instanceof Error) {
            if (error.message.includes('API key invalid')) {
              errorMessage = "مفتاح API غير صالح";
            } else if (error.message.includes('quota exceeded')) {
              errorMessage = "تم تجاوز حصة API اليومية";
            } else if (error.message.includes('forbidden')) {
              errorMessage = "الوصول ممنوع للـ API";
            } else if (error.message.includes('HTTP 404')) {
              errorMessage = "القناة غير موجودة";
            }
          }
          
          toast({
            title: "خطأ",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }

      setVideos(allVideos);
      setFilteredVideos(allVideos);
      
      // Check if we might have more videos (if we got the max requested, there might be more)
      setHasMoreVideos(allVideos.length >= videosPerPage * channels.length);
      
      // Update quota usage
      const usage = youtubeApiTracker.getQuotaUsage();
      setQuotaUsage(usage);
      
      const message = loadMore 
        ? `تم جلب ${allVideos.length - videos.length} فيديوهات إضافية`
        : `تم جلب ${allVideos.length} فيديو من ${successfulFetches}/${channels.length} قنوات (تكلفة: ${usage.totalCost} من ${usage.dailyQuota})`;
      
      toast({
        title: "نجاح",
        description: message,
      });
    } catch (error) {
      console.error("Fetch videos error:", error);
      toast({
        title: "خطأ",
        description: "فشل جلب الفيديوهات. يرجى التحقق من إعدادات API.",
        variant: "destructive",
      });
    } finally {
      if (loadMore) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const clearCache = () => {
    localStorage.removeItem("cacheData");
    setCacheData(null);
    setVideos([]);
    setFilteredVideos([]);
    setHasMoreVideos(true);
    toast({
      title: "نجاح",
      description: "تم مسح الكاش بنجاح",
    });
  };

  const loadMoreVideos = async () => {
    if (!hasMoreVideos || isLoadingMore) return;
    
    // Increase videos per page and fetch more
    const newVideosPerPage = videosPerPage + 10;
    setVideosPerPage(newVideosPerPage);
    await fetchVideos(true);
  };

  const playVideo = async (video: Video) => {
    setIsVideoLoading(true);
    setCurrentVideo(video);
    setIsVideoPlayerOpen(true);
    addToWatched(video);
    
    // Simulate video loading - the custom player will handle actual loading
    setTimeout(() => setIsVideoLoading(false), 500);
  };

  const playVideoWithSync = async (video: Video) => {
    setIsVideoLoading(true);
    setCurrentVideo(video);
    setIsVideoPlayerOpen(true);
    addToWatched(video);
    
    // Simulate video loading - the custom player will handle actual loading
    setTimeout(() => setIsVideoLoading(false), 500);
  };

  const goToVideoPage = (video: Video) => {
    addToWatched(video);
    router.push(`/video/${video.id}`);
  };

  const addToWatched = (video: Video) => {
    const alreadyWatched = watchedVideos.some(v => v.id === video.id);
    if (!alreadyWatched) {
      const watchedVideo: WatchedVideo = {
        ...video,
        watchedAt: new Date().toISOString(),
      };
      setWatchedVideos(prev => [watchedVideo, ...prev]);
    }
  };

  const addToFavorites = (video: Video) => {
    const alreadyFavorited = favoriteVideos.some(v => v.id === video.id);
    if (!alreadyFavorited) {
      const favoriteVideo: FavoriteVideo = {
        ...video,
        favoritedAt: new Date().toISOString(),
      };
      setFavoriteVideos(prev => [favoriteVideo, ...prev]);
      toast({
        title: "تمت الإضافة",
        description: "تمت إضافة الفيديو إلى المفضلة",
      });
    }
  };

  const removeFromFavorites = (videoId: string) => {
    setFavoriteVideos(prev => prev.filter(v => v.id !== videoId));
    toast({
      title: "تم الحذف",
      description: "تم حذف الفيديو من المفضلة",
    });
  };

  const removeFromWatched = (videoId: string) => {
    setWatchedVideos(prev => prev.filter(v => v.id !== videoId));
    toast({
      title: "تم الحذف",
      description: "تم حذف الفيديو من المشاهدة مؤخراً",
    });
  };

  // Notes management functions
  const addNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newNote: Note = {
      ...noteData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
    toast({
      title: "نجاح",
      description: "تمت إضافة الملاحظة بنجاح",
    });
  };

  const updateNote = (id: string, updateData: Partial<Note>) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, ...updateData, updatedAt: new Date().toISOString() }
        : note
    ));
    toast({
      title: "نجاح",
      description: "تم تحديث الملاحظة بنجاح",
    });
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    toast({
      title: "نجاح",
      description: "تم حذف الملاحظة بنجاح",
    });
  };

  const shareNote = (note: Note) => {
    const noteText = `
ملاحظة على درس: ${note.videoTitle}
القناة: ${note.channelTitle}
${note.timestamp ? `الطابع الزمني: ${Math.floor(note.timestamp / 60)}:${(note.timestamp % 60).toString().padStart(2, '0')}` : ''}
المحتوى:
${note.content.replace(/<[^>]*>/g, '')}
${note.tags.length > 0 ? `الوسوم: ${note.tags.join(', ')}` : ''}
    `.trim();

    navigator.clipboard.writeText(noteText);
    toast({
      title: "نجاح",
      description: "تم نسخ الملاحظة إلى الحافظة",
    });
  };

  const shareVideo = (video: Video) => {
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
    const shareText = `شاهد هذا الدرس: ${video.title}\nالقناة: ${video.channelTitle}\nالرابط: ${videoUrl}`;
    
    navigator.clipboard.writeText(shareText);
    toast({
      title: "نجاح",
      description: "تم نسخ معلومات الفيديو إلى الحافظة",
    });
  };

  const getChannelInfo = (channelId: string) => {
    return channels.find(c => c.id === channelId);
  };

  const VideoCard = ({ video, onPlay, onFavorite, onShare, onPlaySync }: { 
    video: Video; 
    onPlay: () => void; 
    onFavorite: () => void;
    onShare: () => void;
    onPlaySync: () => void;
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const channelInfo = getChannelInfo(video.channelId);

    return (
      <Card 
        className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-full overflow-hidden border-0 shadow-md hover:shadow-2xl"
        onClick={onPlay}
      >
        <CardContent className="p-0">
          <div className="relative overflow-hidden bg-gray-100 aspect-video">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
            )}
            <img
              src={imageError ? '/placeholder-video.jpg' : video.thumbnail}
              alt={video.title}
              className={`w-full object-contain transition-transform duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Badge className="absolute bottom-3 right-3 bg-black/90 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm border border-white/20">
              {video.duration}
            </Badge>
            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay();
                }}
              >
                <Play className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
              {video.title}
            </h3>
            <div className="flex items-center gap-2">
              {channelInfo && (
                <img 
                  src={channelInfo.thumbnail} 
                  alt={channelInfo.title}
                  className="w-5 h-5 rounded-full object-cover"
                />
              )}
              <p className="text-gray-600 text-xs line-clamp-1 flex items-center">
                {video.channelTitle}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay();
                }}
                className="flex-1 h-8 text-xs font-medium transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
              >
                <Play className="w-3 h-3 mr-1.5" />
                تشغيل
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite();
                }}
                className={`h-8 w-8 transition-all duration-200 ${
                  favoriteVideos.some(f => f.id === video.id) 
                    ? 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100' 
                    : 'hover:bg-gray-50 hover:text-gray-600'
                }`}
              >
                <Heart className={`w-3 h-3 ${favoriteVideos.some(f => f.id === video.id) ? 'fill-current' : ''}`} />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
                className="h-8 w-8 transition-all duration-200 hover:bg-gray-50 hover:text-gray-600"
              >
                <Share2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const VideoListItem = ({ video, onPlay, onFavorite, onShare }: { 
    video: Video; 
    onPlay: () => void; 
    onFavorite: () => void;
    onShare: () => void;
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const channelInfo = getChannelInfo(video.channelId);

    return (
      <Card 
        className="group cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 w-full overflow-hidden border-0 shadow-md hover:shadow-2xl"
        onClick={onPlay}
      >
        <CardContent className="p-0">
          <div className="flex">
            <div className="relative w-32 sm:w-40 md:w-56 flex-shrink-0 overflow-hidden bg-gray-100 aspect-video">
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
              )}
              <img
                src={imageError ? '/placeholder-video.jpg' : video.thumbnail}
                alt={video.title}
                className={`w-full object-contain transition-transform duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Badge className="absolute bottom-2 right-2 bg-black/90 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm border border-white/20">
                {video.duration}
              </Badge>
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 w-7 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay();
                  }}
                >
                  <Play className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="p-4 flex-1 min-w-0 space-y-3">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
                  {video.title}
                </h3>
                <div className="flex items-center gap-2">
                  {channelInfo && (
                    <img 
                      src={channelInfo.thumbnail} 
                      alt={channelInfo.title}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  )}
                  <p className="text-gray-600 text-xs line-clamp-1 flex items-center">
                    {video.channelTitle}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay();
                  }}
                  className="h-8 text-xs font-medium transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                >
                  <Play className="w-3 h-3 mr-1.5" />
                  تشغيل
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavorite();
                  }}
                  className={`h-8 w-8 transition-all duration-200 ${
                    favoriteVideos.some(f => f.id === video.id) 
                      ? 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100' 
                      : 'hover:bg-gray-50 hover:text-gray-600'
                  }`}
                >
                  <Heart className={`w-3 h-3 ${favoriteVideos.some(f => f.id === video.id) ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                  }}
                  className="h-8 w-8 transition-all duration-200 hover:bg-gray-50 hover:text-gray-600"
                >
                  <Share2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const VideoPlayer = ({ video, isOpen, onClose }: { 
    video: Video | null; 
    isOpen: boolean; 
    onClose: () => void;
  }) => {
    if (!video) return null;

    const relatedVideos = videos.filter(v => 
      v.channelId === video.channelId && v.id !== video.id
    ).slice(0, 6);

    const channelInfo = getChannelInfo(video.channelId);

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{video.title}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 min-h-screen">
            {/* Video Player Section */}
            <div className="lg:col-span-2 bg-black flex flex-col">
              <div className="flex-1 relative">
                {isVideoLoading ? (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <LoadingSpinner size="lg" text="جاري تحميل الفيديو..." />
                  </div>
                ) : (
                  <RobustYouTubePlayer
                    videoId={video.id}
                    title={video.title}
                    autoPlay={true}
                    className="w-full h-full"
                  />
                )}
              </div>
              
              <div className="bg-white p-6 border-t">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Youtube className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 leading-tight">
                        {video.title}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-2">
                          {channelInfo && (
                            <img 
                              src={channelInfo.thumbnail} 
                              alt={channelInfo.title}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          )}
                          <span className="font-medium">{video.channelTitle}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-green-500" />
                          <span>{video.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Videos Section */}
            <div className="bg-gray-50 border-l p-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900">فيديوهات مرتبطة</h3>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {relatedVideos.length}
                  </Badge>
                </div>
                
                {relatedVideos.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Video className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">لا توجد فيديوهات مرتبطة</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {relatedVideos.map((relatedVideo) => (
                      <RelatedVideoCard
                        key={relatedVideo.id}
                        video={relatedVideo}
                        onClick={() => {
                          setCurrentVideo(relatedVideo);
                          addToWatched(relatedVideo);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const RelatedVideoCard = ({ video, onClick }: { 
    video: Video; 
    onClick: () => void;
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const channelInfo = getChannelInfo(video.channelId);

    return (
      <Card 
        key={video.id} 
        className="cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-102 border-0 shadow-sm overflow-hidden"
        onClick={onClick}
      >
        <CardContent className="p-0">
          <div className="flex gap-3">
            <div className="relative w-24 flex-shrink-0 overflow-hidden bg-gray-100 rounded-lg aspect-video">
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-lg" />
              )}
              <img
                src={imageError ? '/placeholder-video.jpg' : video.thumbnail}
                alt={video.title}
                className={`w-full h-full object-contain transition-transform duration-300 hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <Badge className="absolute bottom-1 right-1 bg-black/90 text-white text-xs px-1.5 py-0.5 rounded-full">
                {video.duration}
              </Badge>
            </div>
            <div className="flex-1 min-w-0 py-2">
              <h4 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                {video.title}
              </h4>
              <div className="flex items-center gap-1">
                {channelInfo && (
                  <img 
                    src={channelInfo.thumbnail} 
                    alt={channelInfo.title}
                    className="w-3 h-3 rounded-full object-cover"
                  />
                )}
                <p className="text-xs text-gray-600 line-clamp-1 flex items-center">
                  {video.channelTitle}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Youtube className="w-8 h-8 text-white" />
          </div>
          <LoadingSpinner size="lg" text="جاري تحميل المنصة التعليمية..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LoadingOverlay isLoading={isVideoLoading} text="جاري تحميل الفيديو..." />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-2 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  <Menu className="w-4 h-4 sm:w-6 sm:h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="space-y-6">
                  
                  {/* API Quota Display */}
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold">حصة API</h3>
                    </div>
                    <div className="space-y-2">
                      {quotaUsage ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>المكالمات:</span>
                            <span>{quotaUsage.totalCalls}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>التكلفة:</span>
                            <span>{quotaUsage.totalCost}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>المتبقي:</span>
                            <span>{quotaUsage.remainingQuota}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                (quotaUsage.totalCost / quotaUsage.dailyQuota) > 0.9 
                                  ? 'bg-red-600' 
                                  : (quotaUsage.totalCost / quotaUsage.dailyQuota) > 0.75 
                                    ? 'bg-yellow-600' 
                                    : 'bg-blue-600'
                              }`}
                              style={{ width: `${Math.min(100, (quotaUsage.totalCost / quotaUsage.dailyQuota) * 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-600">
                            {((quotaUsage.totalCost / quotaUsage.dailyQuota) * 100).toFixed(1)}% مستخدم
                          </p>
                          {youtubeApiTracker.getQuotaWarning() && (
                            <p className="text-xs text-orange-600 font-medium">
                              {youtubeApiTracker.getQuotaWarning()}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">جاري التحميل...</p>
                      )}
                    </div>
                  </Card>

                  {/* Cache Info */}
                  {cacheData && (
                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Database className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold">الكاش</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>الفيديوهات:</span>
                          <span>{cacheData.videos.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>آخر تحديث:</span>
                          <span>{new Date(cacheData.lastUpdated).toLocaleDateString()}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={clearCache}
                          className="w-full mt-2"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          مسح الكاش
                        </Button>
                      </div>
                    </Card>
                  )}
                  
                  {/* Detailed Quota Breakdown */}
                  {quotaUsage && Object.keys(quotaUsage.callsByEndpoint).length > 0 && (
                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold">تفصيل الاستخدام</h3>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {Object.entries(quotaUsage.callsByEndpoint).map(([endpoint, data]) => (
                          <div key={endpoint} className="flex justify-between text-sm">
                            <span className="font-medium">{endpoint}:</span>
                            <span>{data.count}x ({data.cost})</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        الإعدادات
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>الإعدادات</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="apiKey">مفتاح YouTube API</Label>
                          <Textarea
                            id="apiKey"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="أدخل مفتاح YouTube API هنا"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="apiQuota">الحصة اليومية لـ API</Label>
                          <Input
                            id="apiQuota"
                            type="number"
                            value={apiQuota}
                            onChange={(e) => setApiQuota(parseInt(e.target.value) || 10000)}
                            placeholder="10000"
                            className="mt-2"
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            الحصة الافتراضية هي 10000 طلب يومياً
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="videosPerPage">عدد الفيديوهات لكل قناة</Label>
                          <Input
                            id="videosPerPage"
                            type="number"
                            min="1"
                            max="50"
                            value={videosPerPage}
                            onChange={(e) => setVideosPerPage(Math.min(50, Math.max(1, parseInt(e.target.value) || 10)))}
                            placeholder="10"
                            className="mt-2"
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            عدد الفيديوهات التي يتم جلبها من كل قناة (1-50)
                          </p>
                        </div>
                        
                        <div className="border-t pt-4">
                          <Label className="text-sm font-medium">اختبار YouTube API</Label>
                          <p className="text-xs text-gray-600 mt-1">
                            اختبر اتصال YouTube API وتشخيص المشاكل
                          </p>
                          <div className="mt-3">
                            <YouTubeAPITest />
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={saveSettings} className="flex-1">
                            حفظ الإعدادات
                          </Button>
                          <Button onClick={resetQuotaTracking} variant="outline" className="flex-1">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            إعادة تعيين الحصة
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="w-4 h-4 mr-2" />
                        إدارة القنوات
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>إدارة القنوات</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="أدخل معرف القناة"
                            value={channelInput}
                            onChange={(e) => setChannelInput(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={addChannel} disabled={isFetchingChannelInfo}>
                            {isFetchingChannelInfo ? <LoadingSpinner size="sm" /> : "إضافة"}
                          </Button>
                        </div>
                        
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {channels.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">لا توجد قنوات مضافة</p>
                          ) : (
                            channels.map((channel) => (
                              <Card key={channel.id} className="p-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={channel.thumbnail}
                                    alt={channel.title}
                                    className="w-12 h-12 rounded-full object-contain"
                                  />
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{channel.title}</h4>
                                    <p className="text-xs text-gray-600">
                                      {channel.subscriberCount} مشترك • {channel.videoCount} فيديو
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeChannel(channel.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </Card>
                            ))
                          )}
                        </div>
                        
                        <Button onClick={() => fetchVideos(false)} className="w-full" disabled={loading}>
                          {loading ? <LoadingSpinner size="sm" /> : "جلب الفيديوهات"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Hadith Encyclopedia Link */}
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = '/hadith'}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    الموسوعة الحديثية
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2">
              <Youtube className="w-6 h-6 text-red-600" />
              <h1 className="text-lg sm:text-xl font-bold">المنصة التعليمية</h1>
            </div>
          </div>
          
          <div className="flex-1 max-w-xs sm:max-w-2xl mx-2 sm:mx-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="بحث في الفيديوهات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-8 sm:h-10 text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              <List className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-2 sm:p-4">
        <Tabs defaultValue="videos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
            <TabsTrigger value="videos" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex items-center gap-2">
              <Video className="w-4 h-4" />
              الفيديوهات ({filteredVideos.length})
            </TabsTrigger>
            <TabsTrigger value="watched" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              المشاهدة ({watchedVideos.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              المفضلة ({favoriteVideos.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              الملاحظات ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="hadith" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              الأحاديث
            </TabsTrigger>
            {currentVideo && (
              <TabsTrigger value="sync" className="text-xs sm:text-sm py-2 px-1 sm:px-3 flex items-center gap-2">
                <Play className="w-4 h-4" />
                تشغيل بمزامنة
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="videos" className="space-y-4">
            {loading ? (
              <div className={
                viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                  : "space-y-4 sm:space-y-6"
              }>
                <LoadingCard count={8} />
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">
                  {channels.length === 0 
                    ? "لا توجد قنوات مضافة. يرجى إضافة القنوات من إدارة القنوات."
                    : "لا توجد فيديوهات. يرجى جلب الفيديوهات من إدارة القنوات."
                  }
                </p>
              </div>
            ) : (
              <div className={
                viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                  : "space-y-4 sm:space-y-6"
              }>
                {filteredVideos.map((video) => (
                  viewMode === "grid" ? (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onPlay={() => goToVideoPage(video)}
                      onFavorite={() => addToFavorites(video)}
                      onShare={() => shareVideo(video)}
                      onPlaySync={() => playVideoWithSync(video)}
                    />
                  ) : (
                    <VideoListItem
                      key={video.id}
                      video={video}
                      onPlay={() => goToVideoPage(video)}
                      onFavorite={() => addToFavorites(video)}
                      onShare={() => shareVideo(video)}
                    />
                  )
                ))}
                
                {/* Load More Button */}
                {hasMoreVideos && filteredVideos.length > 0 && (
                  <div className="col-span-full flex justify-center mt-6">
                    <Button
                      onClick={loadMoreVideos}
                      disabled={isLoadingMore}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          جاري التحميل...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          تحميل المزيد ({videosPerPage} فيديو)
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {/* No more videos message */}
                {!hasMoreVideos && filteredVideos.length > 0 && (
                  <div className="col-span-full text-center mt-6">
                    <p className="text-gray-500">تم عرض جميع الفيديوهات المتاحة</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="watched" className="space-y-4">
            {watchedVideos.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">لا توجد فيديوهات تمت مشاهدتها مؤخراً</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {watchedVideos.map((video) => (
                  <VideoListItem
                    key={video.id}
                    video={video}
                    onPlay={() => playVideo(video)}
                    onFavorite={() => addToFavorites(video)}
                    onShare={() => shareVideo(video)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            {favoriteVideos.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">لا توجد فيديوهات مفضلة</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {favoriteVideos.map((video) => (
                  <VideoListItem
                    key={video.id}
                    video={video}
                    onPlay={() => playVideo(video)}
                    onFavorite={() => removeFromFavorites(video.id)}
                    onShare={() => shareVideo(video)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <EnhancedNotesManager
              notes={notes}
              onAddNote={addNote}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              onShareNote={shareNote}
              currentVideo={currentVideo ? {
                id: currentVideo.id,
                title: currentVideo.title,
                channelTitle: currentVideo.channelTitle,
                thumbnail: currentVideo.thumbnail
              } : undefined}
            />
          </TabsContent>
          
          {currentVideo && (
            <TabsContent value="sync" className="space-y-4">
              <VideoSyncNotes
                videoId={currentVideo.id}
                videoTitle={currentVideo.title}
                videoUrl={`https://www.youtube.com/watch?v=${currentVideo.id}`}
                notes={notes.filter(note => note.videoId === currentVideo.id).map(note => ({
                  id: note.id,
                  content: note.content,
                  timestamp: note.timestamp || 0,
                  tags: note.tags,
                  type: 'note' as const,
                  createdAt: note.createdAt
                }))}
                onAddNote={(note) => {
                  const newNote = {
                    ...note,
                    videoId: currentVideo.id,
                    videoTitle: currentVideo.title,
                    channelTitle: currentVideo.channelTitle,
                    channelThumbnail: currentVideo.thumbnail
                  };
                  addNote(newNote);
                }}
                onUpdateNote={(id, updateData) => {
                  updateNote(id, updateData);
                }}
                onDeleteNote={(id) => {
                  deleteNote(id);
                }}
                onShareNote={(note) => {
                  const fullNote: Note = {
                    id: note.id,
                    videoId: currentVideo.id,
                    videoTitle: currentVideo.title,
                    channelTitle: currentVideo.channelTitle,
                    channelThumbnail: currentVideo.thumbnail,
                    content: note.content,
                    timestamp: note.timestamp,
                    tags: note.tags,
                    createdAt: note.createdAt,
                    updatedAt: new Date().toISOString()
                  };
                  shareNote(fullNote);
                }}
              />
            </TabsContent>
          )}

          <TabsContent value="hadith" className="space-y-4">
            <HadithSearch />
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Video Player Modal */}
      <VideoPlayer
        video={currentVideo}
        isOpen={isVideoPlayerOpen}
        onClose={() => setIsVideoPlayerOpen(false)}
      />
    </div>
  );
}
