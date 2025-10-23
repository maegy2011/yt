import { Eye, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDuration, formatViewCount, formatPublishedDate } from '@/lib/format';

interface VideoMetaProps {
  duration?: string | number | null;
  viewCount?: string | number | null;
  published?: string | null;
  showDuration?: boolean;
  showViews?: boolean;
  showPublished?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VideoMeta({
  duration,
  viewCount,
  published,
  showDuration = true,
  showViews = true,
  showPublished = true,
  size = 'sm',
  className = ''
}: VideoMetaProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]} ${className}`}>
      {showViews && viewCount && (
        <span className="flex items-center gap-1">
          <Eye className={iconSizes[size]} />
          {formatViewCount(viewCount)}
        </span>
      )}
      {showPublished && published && (
        <span className="flex items-center gap-1">
          <Calendar className={iconSizes[size]} />
          {formatPublishedDate(published)}
        </span>
      )}
      {showDuration && duration && (
        <span className="flex items-center gap-1">
          <Clock className={iconSizes[size]} />
          {formatDuration(duration)}
        </span>
      )}
    </div>
  );
}

interface VideoDurationBadgeProps {
  duration?: string | number | null;
  className?: string;
}

export function VideoDurationBadge({ duration, className = '' }: VideoDurationBadgeProps) {
  if (!duration) return null;

  return (
    <Badge className={`absolute bottom-2 right-2 bg-black/80 text-white text-xs ${className}`}>
      {formatDuration(duration)}
    </Badge>
  );
}