export interface WatchedVideo {
  id: string
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: string
  viewCount?: string
  watchedAt: string
  updatedAt: string
}

export interface WatchedVideoInput {
  videoId: string
  title: string
  channelName: string
  thumbnail: string
  duration?: string
  viewCount?: string
}

export interface WatchedHistoryStats {
  totalVideos: number
  totalWatchTime: number
  averageVideoLength: number
  mostWatchedChannel: string
  videosThisWeek: number
  videosThisMonth: number
}