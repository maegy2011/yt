'use client'

import { useState, useEffect, useCallback } from 'react'

interface ChannelAvatarCache {
  [channelId: string]: {
    url: string
    timestamp: number
  }
}

// Cache for channel avatars to avoid repeated API calls
const avatarCache: ChannelAvatarCache = {}
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

export function useChannelAvatar() {
  const [loadingChannels, setLoadingChannels] = useState<Set<string>>(new Set())

  // Function to fetch channel avatar using our API
  const fetchChannelAvatar = useCallback(async (channelId: string): Promise<string> => {
    // Check cache first
    const cached = avatarCache[channelId]
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.url
    }

    // Check if already loading
    if (loadingChannels.has(channelId)) {
      // Return a placeholder while loading
      return 'https://www.gstatic.com/youtube/img/avatars/avatar_default.png'
    }

    setLoadingChannels(prev => new Set(prev).add(channelId))

    try {
      // Use our own API endpoint to get the real channel avatar
      const response = await fetch(`/api/youtube/channel/${channelId}/avatar`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.avatarUrl) {
          // Cache the result
          avatarCache[channelId] = {
            url: data.avatarUrl,
            timestamp: Date.now()
          }
          
          return data.avatarUrl
        }
      }
    } catch (error) {
      console.warn('Failed to fetch channel avatar:', error)
    } finally {
      setLoadingChannels(prev => {
        const newSet = new Set(prev)
        newSet.delete(channelId)
        return newSet
      })
    }

    // Fallback to default avatar
    const fallbackUrl = 'https://www.gstatic.com/youtube/img/avatars/avatar_default.png'
    avatarCache[channelId] = {
      url: fallbackUrl,
      timestamp: Date.now()
    }
    
    return fallbackUrl
  }, [loadingChannels])

  // Function to get channel avatar URL with fallbacks
  const getChannelAvatarUrl = useCallback((channel: any): string => {
    // First try to get channel thumbnail from various sources
    if (channel.thumbnail?.url) return channel.thumbnail.url
    if (channel.thumbnail && typeof channel.thumbnail === 'string' && channel.thumbnail.trim() !== '') {
      return channel.thumbnail
    }
    
    // Get channel ID from various possible locations
    const channelId = channel.channelId || channel.id || channel.channelId
    if (channelId) {
      // Check if we have a cached avatar
      const cached = avatarCache[channelId]
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.url
      }
      
      // Start fetching the avatar in the background if we don't have it cached
      if (!cached) {
        fetchChannelAvatar(channelId).catch(console.error)
      }
      
      // Return the YouTube direct avatar URL as temporary
      return `https://www.youtube.com/channel/${channelId}/avatar.jpg`
    }
    
    // Final fallback - use a generic but recognizable avatar
    return 'https://www.gstatic.com/youtube/img/avatars/avatar_default.png'
  }, [fetchChannelAvatar])

  // Function to preload channel avatar
  const preloadChannelAvatar = useCallback((channelId: string) => {
    if (channelId && !avatarCache[channelId]) {
      fetchChannelAvatar(channelId)
    }
  }, [fetchChannelAvatar])

  return {
    getChannelAvatarUrl,
    fetchChannelAvatar,
    preloadChannelAvatar,
    isLoadingChannel: (channelId: string) => loadingChannels.has(channelId)
  }
}