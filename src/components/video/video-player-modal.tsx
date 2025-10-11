'use client';

import { useState } from 'react';
import { X, Share, ThumbsUp, ThumbsDown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
}

interface VideoPlayerModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ video, isOpen, onClose }: VideoPlayerModalProps) {
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [userAction, setUserAction] = useState<'like' | 'dislike' | null>(null);

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
    if (video) {
      const url = `${window.location.origin}/watch?v=${video.id}`;
      try {
        await navigator.clipboard.writeText(url);
        alert('تم نسخ الرابط إلى الحافظة');
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    }
  };

  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{video.title}</DialogTitle>
        <div className="flex flex-col lg:flex-row h-full">
          {/* Video Player Section */}
          <div className="lg:w-2/3 bg-black">
            <div className="relative aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.title}
              />
            </div>
            
            {/* Video Info */}
            <div className="p-4 bg-background">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">{video.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{video.viewCount} مشاهد</span>
                    <span>•</span>
                    <span>{video.publishedAt}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="lg:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant={userAction === 'like' ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleLike}
                  className="flex items-center gap-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{likeCount > 0 ? likeCount : ''}</span>
                </Button>
                
                <Button
                  variant={userAction === 'dislike' ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleDislike}
                  className="flex items-center gap-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>{dislikeCount > 0 ? dislikeCount : ''}</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center gap-2"
                >
                  <Share className="h-4 w-4" />
                  <span>مشاركة</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span>حفظ</span>
                </Button>
              </div>
              
              {/* Channel Info */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-semibold">
                      {video.channelTitle.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{video.channelTitle}</h3>
                    <p className="text-sm text-muted-foreground">مشترك</p>
                  </div>
                </div>
                <Button variant="default" size="sm">
                  اشتراك
                </Button>
              </div>
              
              {/* Description */}
              <div className="mt-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:w-1/3 border-l max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold mb-4">فيديوهات مقترحة</h3>
              <div className="space-y-3">
                {/* Placeholder for suggested videos */}
                <div className="text-center text-muted-foreground py-8">
                  <p>سيتم تحميل الفيديوهات المقترحة قريباً</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}