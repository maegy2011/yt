"use client";

import { useState, useEffect, useRef } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Play, Shield, Eye, AlertTriangle, Wifi, WifiOff, Globe } from 'lucide-react';
import { YouTubeConnectivityChecker } from './network-detector';

interface RobustYouTubePlayerProps {
  videoId: string;
  title: string;
  autoPlay?: boolean;
  className?: string;
}

type PlayerType = 'lite' | 'direct' | 'fallback';

export function RobustYouTubePlayer({ 
  videoId, 
  title, 
  autoPlay = false,
  className = "" 
}: RobustYouTubePlayerProps) {
  const [playerType, setPlayerType] = useState<PlayerType>('lite');
  const [hasError, setHasError] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset error state when player type changes
  useEffect(() => {
    setHasError(false);
    setIsActivated(false);
    setErrorDetails('');
  }, [playerType]);

  // Handle iframe loading errors
  const handleIframeError = (error?: string) => {
    setHasError(true);
    setErrorDetails(error || 'فشل تحميل الفيديو');
  };

  // Handle successful activation
  const handleActivation = () => {
    setIsActivated(true);
    setHasError(false);
    setErrorDetails('');
  };

  // Try different player types
  const tryPlayerType = (type: PlayerType) => {
    setIsRetrying(true);
    setPlayerType(type);
    setTimeout(() => setIsRetrying(false), 1000);
  };

  // Direct YouTube embed URL
  const getDirectEmbedUrl = () => {
    const params = new URLSearchParams({
      enablejsapi: '1',
      controls: '1',
      rel: '0',
      modestbranding: '1',
      showinfo: '0',
      autoplay: autoPlay ? '1' : '0',
      playsinline: '1',
      fs: '1',
      cc_load_policy: '0',
      iv_load_policy: '3',
      vq: 'hd720'
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  // Fallback embed URL (less restrictive)
  const getFallbackEmbedUrl = () => {
    const params = new URLSearchParams({
      autoplay: autoPlay ? '1' : '0',
      controls: '1'
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  if (hasError) {
    return (
      <Card className={`bg-black border-gray-800 ${className}`}>
        <CardContent className="p-6">
          <div className="text-white text-center">
            {/* Network Status */}
            <div className="mb-4 flex justify-center">
              <YouTubeConnectivityChecker />
            </div>
            
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">فشل تشغيل الفيديو</h3>
              <p className="text-gray-300 mb-4">
                {errorDetails || 'لا يمكن تشغيل هذا الفيديو حالياً. قد يكون بسبب قيود الشبكة أو سياسات يوتيوب.'}
              </p>
            </div>

            {/* Player Type Options */}
            <div className="space-y-3 mb-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">جرب طرق تشغيل مختلفة:</h4>
              
              <Button
                onClick={() => tryPlayerType('lite')}
                disabled={isRetrying || playerType === 'lite'}
                variant={playerType === 'lite' ? 'default' : 'outline'}
                className="w-full justify-start"
              >
                <Shield className="w-4 h-4 ml-2" />
                وضع الخصوصية (موصى به)
                {playerType === 'lite' && <span className="text-xs mr-2">- جاري المحاولة</span>}
              </Button>

              <Button
                onClick={() => tryPlayerType('direct')}
                disabled={isRetrying || playerType === 'direct'}
                variant={playerType === 'direct' ? 'default' : 'outline'}
                className="w-full justify-start"
              >
                <Wifi className="w-4 h-4 ml-2" />
                تشغيل مباشر
                {playerType === 'direct' && <span className="text-xs mr-2">- جاري المحاولة</span>}
              </Button>

              <Button
                onClick={() => tryPlayerType('fallback')}
                disabled={isRetrying || playerType === 'fallback'}
                variant={playerType === 'fallback' ? 'default' : 'outline'}
                className="w-full justify-start"
              >
                <WifiOff className="w-4 h-4 ml-2" />
                وضع بديل (أساسي)
                {playerType === 'fallback' && <span className="text-xs mr-2">- جاري المحاولة</span>}
              </Button>
            </div>

            {/* External Options */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">خيارات خارجية:</h4>
              <div className="space-y-2">
                <Button 
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')} 
                  variant="default" 
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <ExternalLink className="w-4 h-4 ml-2" />
                  مشاهدة على يوتيوب
                </Button>
                
                <Button 
                  onClick={() => window.open(`https://y2mate.is/youtube/${videoId}`, '_blank')} 
                  variant="outline" 
                  className="w-full"
                >
                  <Globe className="w-4 h-4 ml-2" />
                  مشغلات بديلة
                </Button>
              </div>
            </div>

            {/* Troubleshooting Tips */}
            <div className="mt-6 p-3 bg-gray-800 rounded-lg text-xs text-gray-400">
              <h5 className="font-semibold mb-2">نصائح لحل المشكلة:</h5>
              <ul className="space-y-1 text-right">
                <li>• تأكد من اتصال الإنترنت</li>
                <li>• جرب استخدام VPN إذا كنت في منطقة مقيدة</li>
                <li>• تحقق من أن الفيديو متاح للجمهور</li>
                <li>• امسح ذاكرة التخزين المؤقت للمتصفح</li>
                <li>• جرب متصفحاً مختلفاً</li>
                <li>• تأكد من أن يوتيوب متاح في بلدك</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {playerType === 'lite' && (
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
          noCookie={true}
          onIframeAdded={() => {
            handleActivation();
          }}
        />
      )}

      {playerType === 'direct' && (
        <div className="relative w-full h-full">
          <iframe
            ref={iframeRef}
            src={getDirectEmbedUrl()}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={title}
            onLoad={() => {
              handleActivation();
            }}
            onError={() => {
              handleIframeError('فشل التشغيل المباشر');
            }}
          />
        </div>
      )}

      {playerType === 'fallback' && (
        <div className="relative w-full h-full">
          <iframe
            ref={iframeRef}
            src={getFallbackEmbedUrl()}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={title}
            onLoad={() => {
              handleActivation();
            }}
            onError={() => {
              handleIframeError('فشل التشغيل البديل');
            }}
          />
        </div>
      )}

      {/* Player Type Indicator */}
      {!isActivated && (
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-75 hover:opacity-100 transition-opacity backdrop-blur-sm">
          <span className="flex items-center gap-1">
            {playerType === 'lite' && <Shield className="w-3 h-3" />}
            {playerType === 'direct' && <Wifi className="w-3 h-3" />}
            {playerType === 'fallback' && <WifiOff className="w-3 h-3" />}
            {playerType === 'lite' ? 'خصوصية' : playerType === 'direct' ? 'مباشر' : 'بديل'}
          </span>
        </div>
      )}

      {/* Privacy notice - only for lite player */}
      {playerType === 'lite' && !isActivated && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-75 hover:opacity-100 transition-opacity backdrop-blur-sm">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            وضع الخصوصية محمّل
          </span>
        </div>
      )}

      {/* Play instruction */}
      {!isActivated && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-75 hover:opacity-100 transition-opacity backdrop-blur-sm">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            اضغط للتشغيل
          </span>
        </div>
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