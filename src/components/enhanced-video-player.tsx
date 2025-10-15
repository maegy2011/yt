'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  AlertTriangle,
  WifiOff,
  ServerCrash,
  VideoOff,
  Settings,
  ExternalLink,
  Download,
  Share
} from 'lucide-react'

// Dynamically import ReactPlayer to avoid SSR issues
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

interface Video {
  id: string
  title: string
  channel: string
  thumbnail: string
  duration: string
  views: string
  published: string
  url: string
  embedUrl?: string
}

interface EnhancedVideoPlayerProps {
  video: Video
  isPlaying: boolean
  onTogglePlay: () => void
  onVolumeChange: (volume: number) => void
  onSeek: (progress: number) => void
  onFullscreen?: () => void
  volume: number
  progress: number
  duration: number
  className?: string
}

// Error types
type PlayerErrorType = 
  | 'network'
  | 'cors'
  | 'timeout'
  | 'format'
  | 'permissions'
  | 'unknown'
  | 'youtube_restricted'
  | 'embedding_disabled'
  | 'video_not_found'

interface PlayerError {
  type: PlayerErrorType
  message: string
  code?: string | number
  details?: any
  retryable: boolean
  severity: 'low' | 'medium' | 'high'
}

// Error configurations
const ERROR_CONFIG: Record<PlayerErrorType, PlayerError> = {
  network: {
    type: 'network',
    message: 'Network connection error. Please check your internet connection.',
    code: 'NETWORK_ERROR',
    retryable: true,
    severity: 'medium'
  },
  cors: {
    type: 'cors',
    message: 'Cross-origin request blocked. This video may be restricted.',
    code: 'CORS_ERROR',
    retryable: false,
    severity: 'high'
  },
  timeout: {
    type: 'timeout',
    message: 'Video loading timed out. Please try again.',
    code: 'TIMEOUT_ERROR',
    retryable: true,
    severity: 'medium'
  },
  format: {
    type: 'format',
    message: 'Video format not supported. Try a different video.',
    code: 'FORMAT_ERROR',
    retryable: false,
    severity: 'medium'
  },
  permissions: {
    type: 'permissions',
    message: 'Permission denied. Check your browser settings.',
    code: 'PERMISSION_ERROR',
    retryable: false,
    severity: 'high'
  },
  unknown: {
    type: 'unknown',
    message: 'An unknown error occurred. Please try again later.',
    code: 'UNKNOWN_ERROR',
    retryable: true,
    severity: 'medium'
  },
  youtube_restricted: {
    type: 'youtube_restricted',
    message: 'This YouTube video is restricted and cannot be played.',
    code: 'YOUTUBE_RESTRICTED',
    retryable: false,
    severity: 'high'
  },
  embedding_disabled: {
    type: 'embedding_disabled',
    message: 'Embedding is disabled for this video. Watch on YouTube instead.',
    code: 'EMBEDDING_DISABLED',
    retryable: false,
    severity: 'medium'
  },
  video_not_found: {
    type: 'video_not_found',
    message: 'Video not found or has been removed.',
    code: 'VIDEO_NOT_FOUND',
    retryable: false,
    severity: 'high'
  }
}

// Fallback strategies
type FallbackStrategy = 'retry' | 'alternative_url' | 'direct_link' | 'thumbnail_only'

interface FallbackOption {
  id: string
  label: string
  icon: React.ReactNode
  action: FallbackStrategy
  description: string
  priority: number
}

export function EnhancedVideoPlayer({
  video,
  isPlaying,
  onTogglePlay,
  onVolumeChange,
  onSeek,
  onFullscreen,
  volume,
  progress,
  duration,
  className = ""
}: EnhancedVideoPlayerProps) {
  const [playerError, setPlayerError] = useState<PlayerError | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [fallbackStrategy, setFallbackStrategy] = useState<FallbackStrategy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bufferHealth, setBufferHealth] = useState(100)
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good')
  
  const playerRef = useRef<any>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout>()

  // Error detection and classification
  const classifyError = (error: any): PlayerError => {
    const errorMessage = error?.message || error?.toString() || ''
    const errorCode = error?.code || error?.statusCode

    // YouTube specific errors
    if (errorMessage.includes('embedding disabled') || errorMessage.includes('embed disabled')) {
      return ERROR_CONFIG.embedding_disabled
    }

    if (errorMessage.includes('restricted') || errorMessage.includes('private')) {
      return ERROR_CONFIG.youtube_restricted
    }

    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return ERROR_CONFIG.video_not_found
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorCode === 'NETWORK_ERROR') {
      return ERROR_CONFIG.network
    }

    // CORS errors
    if (errorMessage.includes('cors') || errorMessage.includes('cross-origin')) {
      return ERROR_CONFIG.cors
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || errorCode === 'TIMEOUT_ERROR') {
      return ERROR_CONFIG.timeout
    }

    // Format errors
    if (errorMessage.includes('format') || errorMessage.includes('codec')) {
      return ERROR_CONFIG.format
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      return ERROR_CONFIG.permissions
    }

    // Default to unknown error
    return ERROR_CONFIG.unknown
  }

  // Enhanced error handler
  const handleError = (error: any) => {
    console.error('Enhanced video player error:', error)
    const classifiedError = classifyError(error)
    setPlayerError(classifiedError)
    setIsLoading(false)
    
    // Auto-retry for retryable errors
    if (classifiedError.retryable && retryCount < 3) {
      retryTimeoutRef.current = setTimeout(() => {
        handleRetry()
      }, 2000 * (retryCount + 1)) // Exponential backoff
    }
  }

  // Retry mechanism
  const handleRetry = () => {
    if (isRetrying) return
    
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    setPlayerError(null)
    
    // Clear any existing timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }

    // Attempt to reload the video
    setTimeout(() => {
      setIsRetrying(false)
      // Force ReactPlayer to remount by changing key
      if (playerRef.current) {
        playerRef.current.seekTo(0)
      }
    }, 1000)
  }

  // Fallback options
  const getFallbackOptions = (): FallbackOption[] => {
    const options: FallbackOption[] = []

    // Always show retry if error is retryable
    if (playerError?.retryable) {
      options.push({
        id: 'retry',
        label: 'Retry',
        icon: <RefreshCw className="h-4 w-4" />,
        action: 'retry',
        description: 'Try loading the video again',
        priority: 1
      })
    }

    // Alternative URL (if available)
    if (video.embedUrl && video.embedUrl !== video.url) {
      options.push({
        id: 'alternative_url',
        label: 'Alternative URL',
        icon: <ExternalLink className="h-4 w-4" />,
        action: 'alternative_url',
        description: 'Try alternative video source',
        priority: 2
      })
    }

    // Direct link to YouTube
    options.push({
      id: 'direct_link',
      label: 'Watch on YouTube',
      icon: <ExternalLink className="h-4 w-4" />,
      action: 'direct_link',
      description: 'Open video in YouTube',
      priority: 3
    })

    // Thumbnail only
    options.push({
      id: 'thumbnail_only',
      label: 'Show Thumbnail',
      icon: <VideoOff className="h-4 w-4" />,
      action: 'thumbnail_only',
      description: 'Display video thumbnail only',
      priority: 4
    })

    return options.sort((a, b) => a.priority - b.priority)
  }

  // Handle fallback action
  const handleFallbackAction = (action: FallbackStrategy) => {
    setFallbackStrategy(action)

    switch (action) {
      case 'retry':
        handleRetry()
        break
      case 'alternative_url':
        // Switch to alternative URL
        if (playerRef.current && video.embedUrl) {
          playerRef.current.props.url = video.embedUrl
          handleRetry()
        }
        break
      case 'direct_link':
        // Open video in new tab
        window.open(video.url, '_blank')
        break
      case 'thumbnail_only':
        // Show thumbnail only
        setPlayerError(null)
        setIsLoading(false)
        break
    }
  }

  // Connection quality monitoring
  const monitorConnection = () => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      const updateConnectionQuality = () => {
        if (connection.effectiveType) {
          switch (connection.effectiveType) {
            case '4g':
              setConnectionQuality('good')
              break
            case '3g':
              setConnectionQuality('fair')
              break
            case '2g':
            case 'slow-2g':
              setConnectionQuality('poor')
              break
            default:
              setConnectionQuality('good')
          }
        }
      }

      connection.addEventListener('change', updateConnectionQuality)
      updateConnectionQuality()
    }
  }

  // Buffer health monitoring
  const handleBuffer = (state: any) => {
    const loaded = state.loaded || 0
    const played = state.played || 0
    const bufferHealth = ((loaded - played) / (1 - played)) * 100
    setBufferHealth(Math.max(0, Math.min(100, bufferHealth)))
  }

  // Effect hooks
  useEffect(() => {
    monitorConnection()
    
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  // Error icon based on error type
  const getErrorIcon = (errorType: PlayerErrorType) => {
    switch (errorType) {
      case 'network':
        return <WifiOff className="h-6 w-6" />
      case 'cors':
      case 'permissions':
        return <AlertTriangle className="h-6 w-6" />
      case 'youtube_restricted':
      case 'embedding_disabled':
        return <VideoOff className="h-6 w-6" />
      default:
        return <ServerCrash className="h-6 w-6" />
    }
  }

  // Error color based on severity
  const getErrorColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'warning'
      case 'low':
        return 'default'
      default:
        return 'default'
    }
  }

  // Connection quality indicator
  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'good':
        return 'bg-green-500'
      case 'fair':
        return 'bg-yellow-500'
      case 'poor':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Card className={`enhanced-video-player ${className}`}>
      <CardContent className="p-0">
        {/* Connection Quality Indicator */}
        <div className="absolute top-2 right-2 z-20">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getConnectionQualityColor()}`} />
            <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
              {connectionQuality}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p className="text-white">Loading video...</p>
              <Progress value={bufferHealth} className="w-48 mt-2" />
            </div>
          </div>
        )}

        {/* Error State */}
        {playerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <div className="max-w-md w-full p-6">
              <Alert className={`${getErrorColor(playerError.severity)} border-0`}>
                <div className="flex items-center space-x-3 mb-4">
                  {getErrorIcon(playerError.type)}
                  <div>
                    <h4 className="font-semibold text-lg">
                      {playerError.type.replace('_', ' ').toUpperCase()}
                    </h4>
                    <AlertDescription className="mt-1">
                      {playerError.message}
                    </AlertDescription>
                  </div>
                </div>

                {/* Error Details */}
                {playerError.code && (
                  <div className="mt-3 p-2 bg-black/20 rounded">
                    <code className="text-xs">Code: {playerError.code}</code>
                  </div>
                )}

                {/* Retry Information */}
                {playerError.retryable && retryCount > 0 && (
                  <div className="mt-3 text-sm">
                    Retry attempt {retryCount} of 3
                  </div>
                )}

                {/* Fallback Options */}
                <div className="mt-4 space-y-2">
                  <h5 className="font-medium text-sm">What would you like to do?</h5>
                  <div className="grid grid-cols-1 gap-2">
                    {getFallbackOptions().map((option) => (
                      <Button
                        key={option.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleFallbackAction(option.action)}
                        disabled={isRetrying}
                        className="justify-start h-auto p-3"
                      >
                        <div className="flex items-center space-x-3">
                          {option.icon}
                          <div className="text-left">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs opacity-70">{option.description}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Video Info */}
                <div className="mt-4 p-3 bg-black/20 rounded">
                  <h6 className="font-medium text-sm mb-1">{video.title}</h6>
                  <p className="text-xs opacity-70">{video.channel}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {video.views} views
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {video.duration}
                    </Badge>
                  </div>
                </div>
              </Alert>
            </div>
          </div>
        )}

        {/* ReactPlayer with Enhanced Error Handling */}
        <div className="relative aspect-video bg-black">
          <ReactPlayer
            ref={playerRef}
            url={video.embedUrl || video.url}
            width="100%"
            height="100%"
            playing={isPlaying}
            volume={volume}
            muted={volume === 0}
            onPlay={() => {}}
            onPause={() => {}}
            onProgress={handleBuffer}
            onBuffer={() => setIsLoading(true)}
            onBufferEnd={() => setIsLoading(false)}
            onError={handleError}
            onReady={() => {
              setIsLoading(false)
              setPlayerError(null)
            }}
            onStart={() => setIsLoading(false)}
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                  showinfo: 0,
                  controls: 1,
                  disablekb: 0,
                  fs: 1,
                  iv_load_policy: 3,
                  playsinline: 1,
                  autoplay: 0
                },
                embedOptions: {
                  host: 'https://www.youtube.com',
                  embedPath: '/embed/',
                  protocol: 'https'
                },
                attributes: {
                  allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                  allowFullScreen: true
                }
              },
              file: {
                attributes: {
                  controlsList: 'nodownload',
                  playsInline: true
                },
                hlsOptions: {
                  enableWorker: true,
                  lowLatencyMode: true,
                  backBufferLength: 90
                }
              }
            }}
          />

          {/* Video Overlay Controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30">
            {/* Simple play/pause overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="lg"
                variant="ghost"
                className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 text-white border-2 border-white/50"
                onClick={onTogglePlay}
              >
                {isPlaying ? 
                  <Pause className="h-8 w-8" /> : 
                  <Play className="h-8 w-8 ml-1" />
                }
              </Button>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                    {volume > 0 ? 
                      <Volume2 className="h-4 w-4" /> : 
                      <VolumeX className="h-4 w-4" />
                    }
                  </Button>
                  <span className="text-sm">
                    {Math.floor(progress * duration / 60)}:{Math.floor(progress * duration % 60).toString().padStart(2, '0')} / 
                    {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                    <Download className="h-4 w-4" />
                  </Button>
                  {onFullscreen && (
                    <Button size="icon" variant="ghost" className="text-white hover:bg-white/20" onClick={onFullscreen}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for error handling
export function useVideoPlayerError() {
  const [errors, setErrors] = useState<PlayerError[]>([])
  const [currentError, setCurrentError] = useState<PlayerError | null>(null)

  const addError = (error: PlayerError) => {
    setErrors(prev => [...prev, error])
    setCurrentError(error)
  }

  const clearError = () => {
    setCurrentError(null)
  }

  const clearAllErrors = () => {
    setErrors([])
    setCurrentError(null)
  }

  const retryCurrent = () => {
    if (currentError && currentError.retryable) {
      clearError()
      return true
    }
    return false
  }

  return {
    errors,
    currentError,
    addError,
    clearError,
    clearAllErrors,
    retryCurrent
  }
}

// Error boundary component
export function VideoPlayerErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true)
      setError(event.error)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true)
      setError(event.reason)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  if (hasError) {
    return fallback || (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Video Player Error</h3>
        <p className="text-red-600 text-sm">
          An error occurred while loading the video player. Please refresh the page and try again.
        </p>
        {error && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-red-500">Error Details</summary>
            <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
              {error.toString()}
            </pre>
          </details>
        )}
      </div>
    )
  }

  return <>{children}</>
}