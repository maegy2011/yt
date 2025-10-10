"use client";

import { useState } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import { Button } from '@/components/ui/button';
import { ExternalLink, Play, Shield, Eye } from 'lucide-react';

interface LiteYouTubePlayerProps {
  videoId: string;
  title: string;
  autoPlay?: boolean;
  className?: string;
}

export function LiteYouTubePlayer({ 
  videoId, 
  title, 
  autoPlay = false,
  className = "" 
}: LiteYouTubePlayerProps) {
  const [hasError, setHasError] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  // Handle iframe loading errors
  const handleIframeError = () => {
    setHasError(true);
  };

  // Handle successful activation
  const handleActivation = () => {
    setIsActivated(true);
    setHasError(false);
  };

  if (hasError) {
    return (
      <div className={`bg-black flex items-center justify-center ${className}`}>
        <div className="text-white text-center p-4 max-w-md">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold mb-2">خطأ في تشغيل الفيديو</p>
            <p className="text-gray-300 mb-4">
              فشل تحميل مشغل الفيديو. قد يكون الفيديو محمي أو غير متاح في منطقتك.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => {
                  setHasError(false);
                  setIsActivated(false);
                  // Force reload by re-mounting component
                  const key = Date.now();
                  window.location.reload();
                }} 
                variant="outline" 
                className="w-full"
              >
                إعادة المحاولة
              </Button>
              <Button 
                onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')} 
                variant="default" 
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <ExternalLink className="w-4 h-4 ml-2" />
                مشاهدة على يوتيوب
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <LiteYouTubeEmbed
        id={videoId}
        title={title}
        params={`autoplay=${autoPlay ? 1 : 0}&modestbranding=1&rel=0&showinfo=0&controls=1&fs=1&cc_load_policy=0&iv_load_policy=3&vq=hd720&playsinline=1`}
        playlist={false}
        playlistCoverId=""
        iframeClass=""
        playerClass="lty-playbtn"
        wrapperClass="yt-lite"
        poster="hqdefault"
        activatedClass="lyt-activated"
        adNetwork={false}
        noCookie={true} // Use youtube-nocookie.com for privacy
        onIframeAdded={() => {
          // iframe loaded successfully
          handleActivation();
        }}
      />
      
      {/* Privacy notice overlay - only show when not activated */}
      {!isActivated && (
        <>
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-75 hover:opacity-100 transition-opacity backdrop-blur-sm">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              وضع الخصوصية محمّل
            </span>
          </div>
          
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-75 hover:opacity-100 transition-opacity backdrop-blur-sm">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              اضغط للتشغيل
            </span>
          </div>
        </>
      )}
      
      {/* Loading indicator */}
      {isActivated && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm">جاري تحميل الفيديو...</p>
          </div>
        </div>
      )}
    </div>
  );
}