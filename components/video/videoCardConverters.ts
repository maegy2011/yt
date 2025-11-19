import type { VideoCardData } from '@/components/video/VideoCard'
import type { FavoriteVideo } from '@/types/favorites'
import type { FavoriteVideo as SimpleFavoriteVideo } from '@/types/favorites-simple'
import type { WatchedVideo } from '@/types/watched'
import type { SimpleVideo } from '@/lib/type-compatibility'

// Convert FavoriteVideo to VideoCardData
export function favoriteVideoToCardData(favorite: FavoriteVideo | SimpleFavoriteVideo): VideoCardData {
  return {
    videoId: favorite.videoId,
    title: favorite.title,
    channelName: favorite.channelName,
    thumbnail: favorite.thumbnail,
    duration: favorite.duration,
    viewCount: favorite.viewCount,
    addedAt: favorite.addedAt,
    isFavorite: true,
    description: favorite.description,
    channelThumbnail: favorite.channelThumbnail,
    channelHandle: favorite.channelHandle,
    quality: favorite.quality,
    isLive: favorite.isLive,
    subscriberCount: favorite.subscriberCount
  }
}

// Convert WatchedVideo to VideoCardData
export function watchedVideoToCardData(watched: WatchedVideo): VideoCardData {
  console.log('🎯 [VIDEO-CARD-CONVERTER] Converting watched video to card data:', {
    videoId: watched.videoId,
    title: watched.title?.substring(0, 50) + (watched.title?.length > 50 ? '...' : ''),
    currentPosition: watched.currentPosition,
    duration: watched.duration
  })
  
  // Calculate progress percentage
  let progress = 0
  if (watched.currentPosition && watched.duration) {
    // Parse duration string (e.g., "5:30" -> 330 seconds)
    const durationParts = watched.duration.split(':').map(Number)
    const durationInSeconds = durationParts.length === 2 
      ? durationParts[0] * 60 + durationParts[1] 
      : durationParts.length === 3 
        ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
        : 0
    
    if (durationInSeconds > 0) {
      progress = Math.min((watched.currentPosition / durationInSeconds) * 100, 100)
    }
    
    console.log('📊 [VIDEO-CARD-CONVERTER] Calculated progress:', {
      videoId: watched.videoId,
      currentPosition: watched.currentPosition,
      durationString: watched.duration,
      durationInSeconds,
      progressPercent: progress
    })
  } else {
    console.log('📝 [VIDEO-CARD-CONVERTER] No progress calculation possible:', {
      videoId: watched.videoId,
      currentPosition: watched.currentPosition,
      duration: watched.duration
    })
  }

  const result = {
    videoId: watched.videoId,
    title: watched.title,
    channelName: watched.channelName,
    thumbnail: watched.thumbnail,
    duration: watched.duration,
    viewCount: watched.viewCount,
    watchedAt: watched.watchedAt,
    progress: Math.round(progress), // Round to nearest integer
    description: watched.description,
    channelThumbnail: watched.channelThumbnail,
    channelHandle: watched.channelHandle,
    quality: watched.quality,
    isLive: watched.isLive,
    subscriberCount: watched.subscriberCount
  }

  console.log('✅ [VIDEO-CARD-CONVERTER] Final card data:', {
    videoId: result.videoId,
    title: result.title?.substring(0, 30) + (result.title?.length > 30 ? '...' : ''),
    progress: result.progress
  })

  return result
}

// Convert SimpleVideo to VideoCardData
export function simpleVideoToCardData(video: SimpleVideo): VideoCardData {
  return {
    videoId: video.videoId || video.id,
    title: video.title,
    channelName: video.channelName,
    thumbnail: video.thumbnail?.url || video.thumbnail,
    duration: video.duration,
    viewCount: video.viewCount,
    publishedAt: video.publishedAt,
    description: video.description,
    channelThumbnail: video.channel?.thumbnail?.url || video.channelThumbnail,
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
    title: video.title || 'Unknown Title',
    channelName: video.channelName || 'Unknown Channel',
    thumbnail: video.thumbnail?.url || video.thumbnail,
    duration: video.duration,
    viewCount: video.viewCount,
    publishedAt: video.publishedAt,
    description: video.description,
    channelThumbnail: video.channel?.thumbnail?.url || video.channelThumbnail,
    channelHandle: video.channel?.handle || video.channelHandle,
    quality: video.quality,
    isLive: video.isLive,
    subscriberCount: video.channel?.subscriberCount || video.subscriberCount,
    isFavorite: video.isFavorite
  }
}