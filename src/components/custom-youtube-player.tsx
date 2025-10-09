"use client";

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface CustomYouTubePlayerProps {
  videoId: string;
  title: string;
  autoPlay?: boolean;
  className?: string;
}

export function CustomYouTubePlayer({ 
  videoId, 
  title, 
  autoPlay = false,
  className = "" 
}: CustomYouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(autoPlay); // Start muted if autoPlay
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInitialPlayButton, setShowInitialPlayButton] = useState(!autoPlay);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate YouTube embed URL with proper parameters
  const getYouTubeUrl = () => {
    const params = new URLSearchParams({
      enablejsapi: '1',
      controls: '1',
      rel: '0',
      modestbranding: '1',
      showinfo: '0',
      autoplay: autoPlay ? '1' : '0',
      mute: autoPlay ? '1' : '0',
      playsinline: '1',
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      widget_referrer: typeof window !== 'undefined' ? window.location.origin : ''
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  // Handle iframe messages (YouTube player events)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.event === 'infoDelivery') {
          if (data.info && data.info.currentTime) {
            setCurrentTime(data.info.currentTime);
          }
          if (data.info && data.info.duration) {
            setDuration(data.info.duration);
          }
        } else if (data.event === 'onStateChange') {
          switch (data.info) {
            case 1: // PLAYING
              setIsPlaying(true);
              setIsLoading(false);
              setShowInitialPlayButton(false);
              break;
            case 2: // PAUSED
              setIsPlaying(false);
              break;
            case 3: // BUFFERING
              setIsLoading(true);
              break;
            case 0: // ENDED
              setIsPlaying(false);
              break;
          }
        } else if (data.event === 'onReady') {
          setIsLoading(false);
          if (autoPlay) {
            setShowInitialPlayButton(false);
          }
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [autoPlay]);

  // Post message to iframe
  const postMessageToIframe = (command: string, args: any = {}) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args }),
        '*'
      );
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      postMessageToIframe('pauseVideo');
    } else {
      postMessageToIframe('playVideo');
      setShowInitialPlayButton(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      postMessageToIframe('unMute');
      setIsMuted(false);
    } else {
      postMessageToIframe('mute');
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    postMessageToIframe('setVolume', [newVolume * 100]);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  };

  const seekTo = (time: number) => {
    postMessageToIframe('seekTo', [time, true]);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={`bg-black flex items-center justify-center ${className}`}>
        <div className="text-white text-center p-4">
          <p className="mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black ${className}`}>
      {/* YouTube iframe */}
      <iframe
        ref={iframeRef}
        src={getYouTubeUrl()}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title={title}
        onLoad={() => {
          setIsLoading(false);
          if (!autoPlay) {
            setShowInitialPlayButton(true);
          }
        }}
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-white text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>جاري تحميل الفيديو...</p>
          </div>
        </div>
      )}

      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <div className="mb-3">
          <div
            className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newTime = (clickX / rect.width) * duration;
              seekTo(newTime);
            }}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-200"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={togglePlay}
              className="text-white hover:text-white/80"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleMute}
                className="text-white hover:text-white/80"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <div className="w-20">
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              if (iframeRef.current) {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  iframeRef.current.requestFullscreen();
                }
              }
            }}
            className="text-white hover:text-white/80"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Initial Play Button - Only show when video is not playing and not loading */}
      {showInitialPlayButton && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Button 
            onClick={togglePlay}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Play className="w-6 h-6 mr-2" />
            تشغيل الفيديو
          </Button>
        </div>
      )}
    </div>
  );
}