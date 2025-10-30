'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export interface YouTubePlayerRef {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  setVolume: (volume: number) => void
  unMute: () => void
  isReady: () => boolean
}

interface YouTubePlayerProps {
  videoId: string
  width?: string | number
  height?: string | number
  onReady?: (event: any) => void
  onStateChange?: (event: any) => void
  onError?: (event: any) => void
  onEnd?: () => void
  autoplay?: boolean
  mute?: boolean
  className?: string
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  ({ 
    videoId, 
    width = '100%', 
    height = '390', 
    onReady, 
    onStateChange, 
    onError, 
    onEnd,
    autoplay = false,
    mute = true,
    className = ''
  }, ref) => {
    const playerRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isReadyRef = useRef(false)

    // Initialize YouTube API
    useEffect(() => {
      const loadYouTubeAPI = () => {
        if (typeof window !== 'undefined' && !window.YT) {
          console.log('Loading YouTube IFrame API...')
          const tag = document.createElement('script')
          tag.src = 'https://www.youtube.com/iframe_api'
          const firstScriptTag = document.getElementsByTagName('script')[0]
          if (firstScriptTag.parentNode) {
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
          }
        }
      }

      const createPlayer = () => {
        if (!window.YT || !window.YT.Player || !containerRef.current || playerRef.current) {
          console.log('Cannot create player yet:', {
            hasYT: !!window.YT,
            hasPlayer: !!(window.YT && window.YT.Player),
            hasContainer: !!containerRef.current,
            hasPlayerRef: !!playerRef.current
          })
          return
        }

        console.log('Creating YouTube player for video:', videoId)
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId,
          width,
          height,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            mute: mute ? 1 : 0,
            enablejsapi: 1,
            origin: window.location.origin,
            rel: 0,
            modestbranding: 1,
            fs: 1,
            cc_load_policy: 0,
            iv_load_policy: 3,
            autohide: 1,
            controls: 1,
            disablekb: 0,
            playsinline: 1
          },
          events: {
            onReady: (event: any) => {
              isReadyRef.current = true
              console.log('YouTube player ready for video:', videoId)
              
              // Unmute after a short delay if autoplay is enabled
              if (autoplay && mute) {
                setTimeout(() => {
                  if (event.target && typeof event.target.unMute === 'function') {
                    event.target.unMute()
                    event.target.setVolume(50)
                  }
                }, 1000)
              }
              
              onReady?.(event)
            },
            onStateChange: (event: any) => {
              console.log('Player state changed:', event.data, 'for video:', videoId)
              
              // Handle video end
              if (event.data === window.YT.PlayerState.ENDED) {
                onEnd?.()
              }
              
              onStateChange?.(event)
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event, 'for video:', videoId)
              onError?.(event)
            }
          }
        })
      }

      loadYouTubeAPI()

      // Set up the ready callback
      if (!window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady = () => {
          console.log('YouTube IFrame API ready')
          // Wait a moment for API to be fully ready
          setTimeout(() => {
            createPlayer()
          }, 100)
        }
      } else {
        // API already loaded, create player immediately
        console.log('YouTube API already loaded, creating player...')
        setTimeout(() => {
          createPlayer()
        }, 100)
      }

      return () => {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          console.log('Destroying YouTube player')
          playerRef.current.destroy()
          playerRef.current = null
          isReadyRef.current = false
        }
      }
    }, [videoId, width, height, autoplay, mute, onReady, onStateChange, onError, onEnd])

    // Expose player methods via ref
    useImperativeHandle(ref, () => ({
      playVideo: () => {
        if (playerRef.current && isReadyRef.current && typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo()
        } else {
          console.warn('Player not ready or playVideo not available')
        }
      },
      pauseVideo: () => {
        if (playerRef.current && isReadyRef.current && typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo()
        } else {
          console.warn('Player not ready or pauseVideo not available')
        }
      },
      seekTo: (seconds: number, allowSeekAhead = true) => {
        if (playerRef.current && isReadyRef.current && typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(seconds, allowSeekAhead)
        } else {
          console.warn('Player not ready or seekTo not available')
        }
      },
      getCurrentTime: () => {
        if (playerRef.current && isReadyRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          return playerRef.current.getCurrentTime()
        }
        return 0
      },
      getDuration: () => {
        if (playerRef.current && isReadyRef.current && typeof playerRef.current.getDuration === 'function') {
          return playerRef.current.getDuration()
        }
        return 0
      },
      getPlayerState: () => {
        if (playerRef.current && isReadyRef.current && typeof playerRef.current.getPlayerState === 'function') {
          return playerRef.current.getPlayerState()
        }
        return -1
      },
      setVolume: (volume: number) => {
        if (playerRef.current && isReadyRef.current && typeof playerRef.current.setVolume === 'function') {
          playerRef.current.setVolume(volume)
        }
      },
      unMute: () => {
        if (playerRef.current && isReadyRef.current && typeof playerRef.current.unMute === 'function') {
          playerRef.current.unMute()
        }
      },
      isReady: () => isReadyRef.current && playerRef.current !== null
    }), [])

    return (
      <div className={`youtube-player-container ${className}`}>
        <div ref={containerRef} />
      </div>
    )
  }
)

YouTubePlayer.displayName = 'YouTubePlayer'

export default YouTubePlayer