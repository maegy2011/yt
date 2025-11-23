import { FavoriteVideo } from '@/types/favorites'

export function formatViewCount(count: number | string | undefined | null): string {
  if (count === undefined || count === null) return '0 views'
  
  const numCount = typeof count === 'string' ? parseInt(count) : count
  
  if (isNaN(numCount) || numCount < 0) return '0 views'
  
  if (numCount >= 1000000) {
    return `${(numCount / 1000000).toFixed(1)}M views`
  } else if (numCount >= 1000) {
    return `${(numCount / 1000).toFixed(1)}K views`
  } else {
    return `${numCount} views`
  }
}

export function formatAddedAt(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)} weeks ago`
  } else if (diffDays < 365) {
    return `${Math.floor(diffDays / 30)} months ago`
  } else {
    return `${Math.floor(diffDays / 365)} years ago`
  }
}

export function generateFavoriteTitle(videoTitle: string, channelName: string): string {
  return `${videoTitle} - ${channelName}`
}

export function validateFavoriteData(data: {
  videoId: string
  title: string
  channelName: string
}): boolean {
  return !!(
    data.videoId &&
    data.videoId.trim() &&
    data.title &&
    data.title.trim() &&
    data.channelName &&
    data.channelName.trim()
  )
}

export function sortFavoritesByDate(favorites: FavoriteVideo[]): FavoriteVideo[] {
  return [...favorites].sort((a, b) => {
    const dateA = new Date(a.addedAt).getTime()
    const dateB = new Date(b.addedAt).getTime()
    return dateB - dateA // Most recent first
  })
}

export function sortFavoritesByTitle(favorites: FavoriteVideo[]): FavoriteVideo[] {
  return [...favorites].sort((a, b) => a.title.localeCompare(b.title))
}

export function sortFavoritesByViews(favorites: FavoriteVideo[]): FavoriteVideo[] {
  return [...favorites].sort((a, b) => {
    const viewsA = a.viewCount || 0
    const viewsB = b.viewCount || 0
    return viewsB - viewsA // Highest views first
  })
}

export function filterFavoritesByChannel(favorites: FavoriteVideo[], channelName: string): FavoriteVideo[] {
  return favorites.filter(fav => fav.channelName === channelName)
}

export function searchFavorites(favorites: FavoriteVideo[], query: string): FavoriteVideo[] {
  const lowercaseQuery = query.toLowerCase()
  return favorites.filter(fav => 
    fav.title.toLowerCase().includes(lowercaseQuery) ||
    fav.channelName.toLowerCase().includes(lowercaseQuery)
  )
}

export function getUniqueChannels(favorites: FavoriteVideo[]): string[] {
  const channels = favorites.map(fav => fav.channelName)
  return [...new Set(channels)].sort()
}

export function getFavoritesStats(favorites: FavoriteVideo[]): {
  total: number
  totalViews: number
  uniqueChannels: number
  mostRecent: Date | null
} {
  const totalViews = favorites.reduce((sum, fav) => sum + (fav.viewCount || 0), 0)
  const uniqueChannels = new Set(favorites.map(fav => fav.channelName)).size
  const mostRecent = favorites.length > 0 
    ? new Date(Math.max(...favorites.map(fav => new Date(fav.addedAt).getTime())))
    : null
  
  return {
    total: favorites.length,
    totalViews,
    uniqueChannels,
    mostRecent
  }
}

export function groupFavoritesByChannel(favorites: FavoriteVideo[]): Record<string, FavoriteVideo[]> {
  return favorites.reduce((groups, fav) => {
    const channel = fav.channelName
    if (!groups[channel]) {
      groups[channel] = []
    }
    groups[channel].push(fav)
    return groups
  }, {} as Record<string, FavoriteVideo[]>)
}