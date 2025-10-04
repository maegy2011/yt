'use client'

import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'

interface VideoPlayerProps {
  videoId: string
  title?: string
  poster?: string
  className?: string
}

export default function VideoPlayer({ 
  videoId, 
  title, 
  poster, 
  className = '' 
}: VideoPlayerProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <LiteYouTubeEmbed
        id={videoId}
        title={title || 'YouTube Video'}
        poster={poster || 'hqdefault'}
        adNetwork={false}
        cookie={false}
        params={{
          modestbranding: 1,
          rel: 0,
          showinfo: 0
        }}
        iframeClass="w-full h-full"
        playerClass="w-full aspect-video"
        wrapperClass="w-full"
      />
    </div>
  )
}