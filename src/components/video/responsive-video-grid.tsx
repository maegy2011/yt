import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Eye, Grid, List } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
}

interface ResponsiveVideoGridProps {
  videos: Video[];
  onVideoClick?: (video: Video) => void;
  loading?: boolean;
}

export function ResponsiveVideoGrid({ videos, onVideoClick, loading }: ResponsiveVideoGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const ViewModeToggle = () => (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm text-muted-foreground">عرض:</span>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewMode('grid')}
        className="flex items-center gap-1"
      >
        <Grid className="h-4 w-4" />
        <span className="hidden sm:inline">شبكة</span>
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewMode('list')}
        className="flex items-center gap-1"
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">قائمة</span>
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div>
        <ViewModeToggle />
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          : "space-y-4"
        }>
          {Array.from({ length: 12 }).map((_, index) => (
            <VideoCardSkeleton key={index} viewMode={viewMode} />
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 mb-4 text-muted-foreground">
          <svg
            className="w-full h-full"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-muted-foreground">لا توجد فيديوهات متاحة</p>
      </div>
    );
  }

  return (
    <div>
      <ViewModeToggle />
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
        : "space-y-4"
      }>
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={onVideoClick}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
}

interface VideoCardProps {
  video: Video;
  onClick?: (video: Video) => void;
  viewMode: 'grid' | 'list';
}

function VideoCard({ video, onClick, viewMode }: VideoCardProps) {
  const handleClick = () => {
    // Redirect to watch page instead of calling onClick
    window.location.href = `/watch?v=${video.id}`;
  };

  if (viewMode === 'list') {
    return (
      <Card 
        className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
        onClick={handleClick}
      >
        <CardContent className="p-0">
          <div className="flex">
            <div className="relative w-48 h-28 flex-shrink-0">
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 192px, 384px"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            </div>
            <div className="flex-1 p-4">
              <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {video.title}
              </h3>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {video.channelTitle}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{video.viewCount} مشاهد</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{video.publishedAt}</span>
                  </div>
                </div>
                
                {video.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {video.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="aspect-video relative overflow-hidden">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">
            {video.channelTitle}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{video.viewCount} مشاهد</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{video.publishedAt}</span>
            </div>
          </div>
        </div>
        
        {video.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {video.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function VideoCardSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            <div className="w-48 h-28 bg-muted animate-pulse flex-shrink-0" />
            <div className="flex-1 p-4">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted animate-pulse" />
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}