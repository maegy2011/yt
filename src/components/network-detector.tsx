"use client";

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface NetworkStatus {
  online: boolean;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: true,
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      const status: NetworkStatus = {
        online: navigator.onLine,
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false
      };

      setNetworkStatus(status);
    };

    // Initial check
    updateNetworkStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Listen for connection changes
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
}

export function NetworkDetector() {
  const networkStatus = useNetworkStatus();

  if (networkStatus.online) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
        <Wifi className="w-3 h-3" />
        <span>متصل ({networkStatus.effectiveType.toUpperCase()})</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
      <WifiOff className="w-3 h-3" />
      <span>غير متصل بالإنترنت</span>
    </div>
  );
}

export function YouTubeConnectivityChecker() {
  const networkStatus = useNetworkStatus();
  const [youtubeAccessible, setYoutubeAccessible] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const checkYouTubeAccess = async () => {
    setChecking(true);
    try {
      // Try to fetch a small YouTube API endpoint or image
      const response = await fetch('https://www.youtube.com/favicon.ico', {
        mode: 'no-cors',
        cache: 'no-cache'
      });
      setYoutubeAccessible(true);
    } catch (error) {
      setYoutubeAccessible(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkYouTubeAccess();
  }, []);

  const getConnectivityStatus = () => {
    if (!networkStatus.online) {
      return { status: 'offline', icon: WifiOff, color: 'red', text: 'غير متصل بالإنترنت' };
    }
    
    if (youtubeAccessible === null) {
      return { status: 'checking', icon: AlertCircle, color: 'yellow', text: 'جاري التحقق...' };
    }
    
    if (youtubeAccessible === false) {
      return { status: 'blocked', icon: AlertCircle, color: 'red', text: 'يوتيوب غير متاح' };
    }
    
    return { status: 'online', icon: Wifi, color: 'green', text: 'يوتيوب متاح' };
  };

  const connectivityStatus = getConnectivityStatus();
  const Icon = connectivityStatus.icon;

  return (
    <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded bg-${connectivityStatus.color}-50 text-${connectivityStatus.color}-600`}>
      <Icon className="w-3 h-3" />
      <span>{connectivityStatus.text}</span>
      {checking && (
        <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin"></div>
      )}
      <button 
        onClick={checkYouTubeAccess}
        className="ml-1 text-xs underline"
      >
        إعادة التحقق
      </button>
    </div>
  );
}