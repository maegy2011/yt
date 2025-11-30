import type { VideoCardData } from '@/components/video/VideoCard'
import type { FavoriteVideo } from '@/types'
import type { WatchedVideo } from '@/types'
import type { SimpleVideo } from '@/types'

// Convert FavoriteVideo to VideoCardData
export function favoriteVideoToCardData(favorite: FavoriteVideo): VideoCardData {
  return {
    videoId: favorite.videoId,
    id: favorite.id,
    title: favorite.title,
    channelName: favorite.channelName,
    thumbnail: favorite.thumbnail || '',
    duration: typeof favorite.duration === 'string' ? favorite.duration : undefined,
    viewCount: typeof favorite.viewCount === 'number' ? favorite.viewCount : undefined,
    addedAt: favorite.addedAt,
    updatedAt: favorite.updatedAt,
    isFavorite: true,
    description: favorite.notes || undefined, // Use notes as description
    channelThumbnail: undefined, // Not available in FavoriteVideo
    channelHandle: undefined, // Not available in FavoriteVideo
    quality: undefined, // Not available in FavoriteVideo
    isLive: false, // Not available in FavoriteVideo
    subscriberCount: undefined // Not available in FavoriteVideo
  }
}

// Convert WatchedVideo to VideoCardData
export function watchedVideoToCardData(watched: WatchedVideo): VideoCardData {
  return {
    videoId: watched.videoId,
    id: watched.id,
    title: watched.title,
    channelName: watched.channelName,
    thumbnail: watched.thumbnail || '',
    duration: watched.duration,
    viewCount: watched.viewCount ? parseInt(watched.viewCount) : undefined,
    watchedAt: watched.watchedAt,
    updatedAt: watched.updatedAt,
    progress: 0, // Default progress since WatchedVideo doesn't have progress field
    description: undefined, // WatchedVideo doesn't have description field
    channelThumbnail: undefined, // WatchedVideo doesn't have channelThumbnail field
    channelHandle: undefined, // WatchedVideo doesn't have channelHandle field
    quality: undefined, // WatchedVideo doesn't have quality field
    isLive: false, // WatchedVideo doesn't have isLive field
    subscriberCount: undefined // WatchedVideo doesn't have subscriberCount field
  }
}

// Convert SimpleVideo to VideoCardData
export function simpleVideoToCardData(video: SimpleVideo): VideoCardData {
  return {
    videoId: video.videoId,
    id: video.id,
    title: video.title,
    channelName: video.channelName,
    thumbnail: (video.thumbnail as string) || (video.thumbnail as any)?.url || '',
    duration: typeof video.duration === 'string' ? video.duration : undefined,
    viewCount: typeof video.viewCount === 'number' ? video.viewCount : undefined,
    publishedAt: video.publishedAt || undefined,
    description: video.description,
    channelThumbnail: (video.channel as any)?.thumbnail?.url || video.channelThumbnail,
    channelHandle: video.channel?.handle || video.channelHandle,
    quality: video.quality,
    isLive: video.isLive,
    subscriberCount: video.channel?.subscriberCount || video.subscriberCount,
    isFavorite: video.isFavorite
  }
}

// Generic converter that handles different video types
export function toVideoCardData(video: any): VideoCardData {
  // Check if it's a favorite video
  if (video.videoId && video.addedAt) {
    return favoriteVideoToCardData(video)
  }
  
  // Check if it's a watched video
  if (video.videoId && video.watchedAt) {
    return watchedVideoToCardData(video)
  }
  
  // Check if it's a simple video
  if (video.videoId || video.id) {
    return simpleVideoToCardData(video)
  }
  
  // Fallback - try to create VideoCardData from generic object
  return {
    videoId: video.videoId || video.id,
    id: video.id,
    title: video.title || 'Unknown Title',
    channelName: video.channelName || 'Unknown Channel',
    thumbnail: (video.thumbnail as string) || (video.thumbnail as any)?.url || '',
    duration: typeof video.duration === 'string' ? video.duration : undefined,
    viewCount: typeof video.viewCount === 'number' ? video.viewCount : undefined,
    publishedAt: video.publishedAt || undefined,
    description: video.description,
    channelThumbnail: (video.channel as any)?.thumbnail?.url || video.channelThumbnail,
    channelHandle: video.channel?.handle || video.channelHandle,
    quality: video.quality,
    isLive: video.isLive,
    subscriberCount: video.channel?.subscriberCount || video.subscriberCount,
    isFavorite: video.isFavorite
  }
}