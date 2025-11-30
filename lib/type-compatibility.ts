// Type compatibility utilities for YouTube app
// This file now re-exports from the unified type system

// Re-export all types from the unified system
export * from '@/types'

// Legacy exports for backward compatibility
export type {
  SimpleVideo,
  SimplePlaylist,
  SimpleChannel,
  FavoriteVideo,
  FavoriteChannel,
  VideoNote,
  ChannelSearchResult,
  PaginationInfo,
  FollowedChannelsContent,
  VideoCardData,
  BaseVideoData,
  BlacklistedItem,
  WhitelistedItem
} from '@/types'

// Re-export conversion functions
export {
  convertYouTubeVideo,
  convertToYouTubeVideo,
  convertYouTubePlaylist,
  convertYouTubeChannel,
  convertDbVideoToSimple,
  convertSimpleVideoToCardData,
  convertFavoriteVideoToCardData,
  convertCardDataToSimpleVideo
} from '@/types'

// Re-export type guards
export {
  isVideoCardData,
  isSimpleVideo,
  isFavoriteVideo,
  isVideoNote
} from '@/types'