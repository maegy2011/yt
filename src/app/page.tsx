'use client';

import { useState, useEffect } from 'react';
import { Search, Play, Eye, Clock, Calendar, ChevronLeft, ChevronRight, Loader2, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivacyBadge } from '@/components/privacy-badge';
import { PrivacySettings } from '@/components/privacy-settings';
import { PrivacyPolicy } from '@/components/privacy-policy';
import { AccessStatus } from '@/components/access-status';

interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
  viewCount: string;
  published: string;
  channelName: string;
  channelId: string;
  thumbnail: string;
  badges: string[];
}

interface SearchResult {
  videos: Video[];
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('الحويني');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const searchYouTube = async (query: string, page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&page=${page}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setCurrentPage(page);
      } else {
        console.error('Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchYouTube(searchQuery.trim(), 1);
    }
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const handlePageChange = (page: number) => {
    if (searchQuery.trim()) {
      searchYouTube(searchQuery.trim(), page);
    }
  };

  const handleBackToSearch = () => {
    setSelectedVideo(null);
  };

  useEffect(() => {
    // Auto search on mount with default query
    searchYouTube(searchQuery, 1);
  }, []);

  if (selectedVideo) {
    return <VideoPlayer video={selectedVideo} onBack={handleBackToSearch} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">YouTube Search</h1>
            <p className="text-muted-foreground mb-4">Search and watch YouTube videos</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <PrivacyBadge />
              <AccessStatus />
              <PrivacySettings>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Privacy Settings
                </Button>
              </PrivacySettings>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search YouTube..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-12 text-base"
              />
              <Button type="submit" disabled={loading} className="h-12 px-6">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>
        </header>

        {/* Search Results */}
        <main>
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && searchResults && (
            <>
              {/* Results Info */}
              <div className="mb-6 text-center">
                <p className="text-muted-foreground">
                  Found {searchResults.totalResults} results for "{searchQuery}"
                </p>
              </div>

              {/* Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {searchResults.videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => handleVideoClick(video)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {searchResults.totalPages > 1 && (
                <Pagination
                  currentPage={searchResults.currentPage}
                  totalPages={searchResults.totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}

          {!loading && !searchResults && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No search results yet. Try searching for something!</p>
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="mt-16 py-8 border-t">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Privacy-Protected YouTube Experience</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>🛡️ No Tracking Cookies</span>
              <span>🚫 Ad-Free</span>
              <span>🔒 Secure Connection</span>
              <span>🌍 Privacy Mode</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your privacy is our priority. No data is collected or shared with third parties.
            </p>
            <div className="mt-2">
              <PrivacyPolicy />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function VideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group" onClick={onClick}>
      <div className="relative aspect-video bg-muted">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-primary/90 rounded-full p-3">
              <Play className="h-6 w-6 text-primary-foreground fill-current" />
            </div>
          </div>
        </div>
        {video.duration && (
          <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
            {video.duration}
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-2 text-sm leading-tight">
          {video.title}
        </h3>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
          {video.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">{video.channelName}</span>
          <div className="flex items-center gap-2">
            {video.viewCount && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {video.viewCount}
              </span>
            )}
            {video.published && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {video.published}
              </span>
            )}
          </div>
        </div>
        {video.badges.length > 0 && (
          <div className="flex gap-1 mt-2">
            {video.badges.map((badge, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages: number[] = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      {startPage > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
          >
            1
          </Button>
          {startPage > 2 && <span className="px-2">...</span>}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2">...</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function VideoPlayer({ video, onBack }: { video: Video; onBack: () => void }) {
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoInfo = async () => {
      try {
        const response = await fetch(`/api/youtube/video?id=${video.id}`);
        if (response.ok) {
          const data = await response.json();
          setVideoInfo(data);
        } else {
          setError('Failed to load video');
        }
      } catch (err) {
        setError('Error loading video');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoInfo();
  }, [video.id]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button onClick={onBack} variant="outline" className="mb-6">
          ← Back to search
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="aspect-video bg-black">
                {loading && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                {error && (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <p className="text-center px-4">{error}</p>
                  </div>
                )}
                {videoInfo?.streamingUrl && !loading && !error && (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0`}
                    title={video.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  />
                )}
                {!videoInfo?.streamingUrl && !loading && !error && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                      <p className="mb-4">Video streaming not available</p>
                      <a
                        href={`https://www.youtube-nocookie.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-blue-400 hover:underline"
                      >
                        Watch on YouTube (Privacy Mode)
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold mb-4">{video.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {video.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {video.published}
                  </span>
                  {video.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {video.duration}
                    </span>
                  )}
                </div>
                <div className="mb-4">
                  <p className="font-medium mb-2">{video.channelName}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {video.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-semibold mb-4">Video Details</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Quality:</span>
                    <span className="ml-2 text-muted-foreground">
                      {videoInfo?.quality || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Format:</span>
                    <span className="ml-2 text-muted-foreground">
                      {videoInfo?.mimeType?.split('/')[1] || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Resolution:</span>
                    <span className="ml-2 text-muted-foreground">
                      {videoInfo?.width && videoInfo?.height 
                        ? `${videoInfo.width}x${videoInfo.height}` 
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Channel:</span>
                    <span className="ml-2 text-muted-foreground">
                      {video.channelName}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}