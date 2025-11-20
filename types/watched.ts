export interface WatchedVideo {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: string
  viewCount?: string
  currentPosition?: number  // Current playback position in seconds
  lastWatchedAt?: string   // Last time the video was watched
  watchedAt: string
  updatedAt: string
  progress?: number        // Calculated progress percentage (0-100)
}

export interface WatchedVideoInput {
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: string
  viewCount?: string
  currentPosition?: number
  lastWatchedAt?: string
}

export interface WatchedHistoryStats {
  totalVideos: number
  totalWatchTime: number
  averageVideoLength: number
  mostWatchedChannel: string
  videosThisWeek: number
  videosThisMonth: number
}