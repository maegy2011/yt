'use client';

import { useState, useEffect } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Loader2, X } from 'lucide-react';

interface Video {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnails: any;
  duration: string;
  channelId: string;
  channel?: {
    id: string;
    channelId: string;
    channelTitle: string;
  };
  addedAt: string;
  manualTags: string[];
}

interface Channel {
  id: string;
  channelId: string;
  channelTitle: string;
  _count: {
    videos: number;
  };
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInfo, setSearchInfo] = useState<any>(null);

  const videosPerPage = 12;

  useEffect(() => {
    fetchVideos();
    fetchChannels();
  }, [currentPage, searchTerm, selectedChannel, selectedTags]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: videosPerPage.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedChannel && selectedChannel !== 'all') params.append('channelId', selectedChannel);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));

      const response = await fetch(`/api/videos/list?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos);
        setTotalPages(data.pagination.pages);
        setSearchInfo(data.searchInfo);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/channels/list?limit=100');
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVideos();
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedChannel('');
    setSelectedTags([]);
    setCurrentPage(1);
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '';
    // Convert PT1H2M3S to 1:02:03
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Extract all unique tags from videos
  const allTags = Array.from(
    new Set(
      videos.flatMap(video => 
        Array.isArray(video.manualTags) ? video.manualTags : []
      )
    )
  ).sort();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-primary">YT Islami</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
                <Input
                  type="text"
                  placeholder="بحث عن فيديو..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64"
                />
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              <div className="flex gap-2">
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="القناة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع القنوات</SelectItem>
                    {channels.map((channel) => (
                      <SelectItem key={channel.channelId} value={channel.channelId}>
                        {channel.channelTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      {(searchTerm || selectedChannel || selectedTags.length > 0) && (
        <div className="border-b bg-muted/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">الفلاتر النشطة:</span>
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  بحث: {searchTerm}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSearchTerm('')}
                  />
                </Badge>
              )}
              {selectedChannel && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  القناة: {channels.find(c => c.channelId === selectedChannel)?.channelTitle}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSelectedChannel('')}
                  />
                </Badge>
              )}
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleTagToggle(tag)}
                  />
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="h-6 px-2"
              >
                مسح الكل
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div className="border-b bg-background">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">التصنيفات:</span>
              {allTags.slice(0, 10).map(tag => (
                <Badge 
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
              {allTags.length > 10 && (
                <Badge variant="outline" className="text-muted-foreground">
                  +{allTags.length - 10} أخرى
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Search Info */}
            {searchInfo && searchInfo.query && (
              <div className="mb-6 text-center">
                <p className="text-sm text-muted-foreground">
                  نتائج البحث عن "{searchInfo.query}": 
                  <span className="font-medium"> {searchInfo.foundResults} </span>
                  من أصل 
                  <span className="font-medium"> {searchInfo.totalResults} </span>
                  فيديو
                </p>
              </div>
            )}

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <Card key={video.videoId} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="relative aspect-video bg-black">
                      <LiteYouTubeEmbed
                        id={video.videoId}
                        title={video.title}
                        adNetwork={false}
                        params="rel=0"
                        poster="hqdefault"
                        wrapperClass="yt-lite"
                        playerClass="lty-playbtn"
                      />
                      {video.duration && (
                        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-sm font-medium line-clamp-2 mb-2">
                      {video.title}
                    </CardTitle>
                    {video.channel && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {video.channel.channelTitle}
                      </p>
                    )}
                    {video.manualTags && video.manualTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {Array.isArray(video.manualTags) && video.manualTags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {video.manualTags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{video.manualTags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(video.addedAt).toLocaleDateString('ar-SA')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                </Button>
              </div>
            )}

            {videos.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchTerm || selectedChannel || selectedTags.length > 0 
                    ? 'لا توجد فيديوهات تطابق معايير البحث' 
                    : 'لا توجد فيديوهات متاحة'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}