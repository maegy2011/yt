// Type compatibility utilities for YouTube app

import type { Video as YouTubeVideo, Playlist as YouTubePlaylist } from '@/lib/youtube'

export interface SimpleVideo {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: string
  viewCount?: number
  publishedAt?: string
  isLive?: boolean
  description?: string
  type?: 'video'
}

export interface SimplePlaylist {
  id: string
  playlistId: string
  title: string
  channelName: string
  thumbnail: string
  videoCount: number
  viewCount?: number
  lastUpdatedAt?: string
  description?: string
  type: 'playlist'
}

export interface BaseVideoData {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: string
  viewCount?: number
}

export interface WatchedVideo extends BaseVideoData {
  watchedAt: string
}

export type FavoriteVideo = BaseVideoData

export interface FavoriteChannel {
  id: string
  channelId: string
  name: string
  thumbnail?: string
  subscriberCount?: number
  viewCount?: number
}

// Convert YouTube API Video to SimpleVideo
export function convertYouTubeVideo(video: YouTubeVideo): SimpleVideo {
  return {
    id: video.id,
    videoId: video.id,
    title: video.title,
    channelName: video.channel.name,
    thumbnail: typeof video.thumbnail === 'string' 
      ? video.thumbnail 
      : video.thumbnail.url,
    duration: video.duration,
    viewCount: video.viewCount,
    publishedAt: video.publishedAt,
    isLive: video.isLive,
    description: video.description
  }
}

// Convert SimpleVideo to YouTubeVideo (for compatibility)
export function convertToYouTubeVideo(video: SimpleVideo): YouTubeVideo {
  return {
    id: video.id,
    title: video.title,
    description: video.description || '',
    thumbnail: {
      url: video.thumbnail,
      width: 320,
      height: 180
    },
    channel: {
      name: video.channelName,
      id: video.channelName, // fallback
      thumbnail: {
        url: video.thumbnail,
        width: 320,
        height: 180
      }
    },
    duration: video.duration || '0:00',
    viewCount: video.viewCount || 0,
    publishedAt: video.publishedAt || new Date().toISOString(),
    isLive: video.isLive || false
  }
}

// Convert YouTube API Playlist to SimplePlaylist
export function convertYouTubePlaylist(playlist: YouTubePlaylist): SimplePlaylist {
  return {
    id: playlist.id,
    playlistId: playlist.id,
    title: playlist.title,
    channelName: playlist.channel.name,
    thumbnail: typeof playlist.thumbnail === 'string' 
      ? playlist.thumbnail 
      : playlist.thumbnail.url,
    videoCount: playlist.videoCount,
    viewCount: playlist.viewCount,
    lastUpdatedAt: playlist.lastUpdatedAt,
    description: playlist.description,
    type: 'playlist'
  }
}

// Convert database video to SimpleVideo
export function convertDbVideoToSimple(dbVideo: WatchedVideo | FavoriteVideo): SimpleVideo {
  return {
    id: dbVideo.id,
    videoId: dbVideo.videoId,
    title: dbVideo.title,
    channelName: dbVideo.channelName,
    thumbnail: dbVideo.thumbnail,
    duration: dbVideo.duration,
    viewCount: dbVideo.viewCount,
    publishedAt: 'watchedAt' in dbVideo ? dbVideo.watchedAt : new Date().toISOString(),
    isLive: false,
    type: 'video'
  }
}