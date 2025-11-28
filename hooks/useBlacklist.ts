'use client'

import { useState, useEffect, useCallback } from 'react'

interface BlacklistedItem {
  id: string
  itemId: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
  addedAt: string
  updatedAt: string
}

interface WhitelistedItem {
  id: string
  itemId: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
  addedAt: string
  updatedAt: string
}

interface BlacklistStats {
  total: number
  recent: number
  byType: Record<string, number>
  types: Array<{ type: string; count: number }>
}

interface UseBlacklistOptions {
  autoLoad?: boolean
  cacheTime?: number
}

export function useBlacklist(options: UseBlacklistOptions = {}) {
  const { autoLoad = true, cacheTime = 5 * 60 * 1000 } = options
  
  const [blacklisted, setBlacklisted] = useState<BlacklistedItem[]>([])
  const [whitelisted, setWhitelisted] = useState<WhitelistedItem[]>([])
  const [blacklistStats, setBlacklistStats] = useState<BlacklistStats | null>(null)
  const [whitelistStats, setWhitelistStats] = useState<BlacklistStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cache for storing fetched data
  const [cache, setCache] = useState<{
    blacklist: { data: BlacklistedItem[]; timestamp: number } | null
    whitelist: { data: WhitelistedItem[]; timestamp: number } | null
  }>({
    blacklist: null,
    whitelist: null
  })

  // Check if cache is still valid
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < cacheTime
  }, [cacheTime])

  // Fetch blacklist items
  const fetchBlacklist = useCallback(async (useCache = true) => {
    if (useCache && cache.blacklist && isCacheValid(cache.blacklist.timestamp)) {
      setBlacklisted(cache.blacklist.data)
      return cache.blacklist.data
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/blacklist')
      if (!response.ok) throw new Error('Failed to fetch blacklist')
      
      const result = await response.json()
      const items = result.items || []
      
      setBlacklisted(items)
      setCache(prev => ({
        ...prev,
        blacklist: { data: items, timestamp: Date.now() }
      }))
      
      return items
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch blacklist'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [cache.blacklist, isCacheValid, cacheTime])

  // Fetch whitelist items
  const fetchWhitelist = useCallback(async (useCache = true) => {
    if (useCache && cache.whitelist && isCacheValid(cache.whitelist.timestamp)) {
      setWhitelisted(cache.whitelist.data)
      return cache.whitelist.data
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/whitelist')
      if (!response.ok) throw new Error('Failed to fetch whitelist')
      
      const result = await response.json()
      const items = result.items || []
      
      setWhitelisted(items)
      setCache(prev => ({
        ...prev,
        whitelist: { data: items, timestamp: Date.now() }
      }))
      
      return items
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch whitelist'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [cache.whitelist, isCacheValid, cacheTime])

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const [blacklistResponse, whitelistResponse] = await Promise.all([
        fetch('/api/blacklist', { method: 'PUT' }),
        fetch('/api/whitelist', { method: 'PUT' })
      ])

      if (blacklistResponse.ok) {
        const blacklistData = await blacklistResponse.json()
        setBlacklistStats(blacklistData)
      }

      if (whitelistResponse.ok) {
        const whitelistData = await whitelistResponse.json()
        setWhitelistStats(whitelistData)
      }
    } catch (err) {
      // Failed to fetch stats
    }
  }, [])

  // Add item to blacklist
  const addToBlacklist = useCallback(async (item: Omit<BlacklistedItem, 'id' | 'addedAt' | 'updatedAt'>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to add to blacklist')
      }
      
      // Invalidate cache and refetch
      setCache(prev => ({ ...prev, blacklist: null }))
      await fetchBlacklist(false)
      await fetchStats()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to blacklist'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchBlacklist, fetchStats])

  // Add item to whitelist
  const addToWhitelist = useCallback(async (item: Omit<WhitelistedItem, 'id' | 'addedAt' | 'updatedAt'>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to add to whitelist')
      }
      
      // Invalidate cache and refetch
      setCache(prev => ({ ...prev, whitelist: null }))
      await fetchWhitelist(false)
      await fetchStats()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to whitelist'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchWhitelist, fetchStats])

  // Remove item from blacklist
  const removeFromBlacklist = useCallback(async (itemId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/blacklist?itemId=${encodeURIComponent(itemId)}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to remove from blacklist')
      }
      
      // Update local state immediately
      setBlacklisted(prev => prev.filter(item => item.itemId !== itemId))
      
      // Invalidate cache and refetch
      setCache(prev => ({ ...prev, blacklist: null }))
      await fetchBlacklist(false)
      await fetchStats()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from blacklist'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchBlacklist, fetchStats])

  // Remove item from whitelist
  const removeFromWhitelist = useCallback(async (itemId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/whitelist?itemId=${encodeURIComponent(itemId)}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to remove from whitelist')
      }
      
      // Update local state immediately
      setWhitelisted(prev => prev.filter(item => item.itemId !== itemId))
      
      // Invalidate cache and refetch
      setCache(prev => ({ ...prev, whitelist: null }))
      await fetchWhitelist(false)
      await fetchStats()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from whitelist'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchWhitelist, fetchStats])

  // Batch operations
  const batchAddToBlacklist = useCallback(async (items: Omit<BlacklistedItem, 'id' | 'addedAt' | 'updatedAt'>[]) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/blacklist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'bulk-add', items })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to bulk add to blacklist')
      }
      
      // Invalidate cache and refetch
      setCache(prev => ({ ...prev, blacklist: null }))
      await fetchBlacklist(false)
      await fetchStats()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk add to blacklist'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchBlacklist, fetchStats])

  const batchAddToWhitelist = useCallback(async (items: Omit<WhitelistedItem, 'id' | 'addedAt' | 'updatedAt'>[]) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/whitelist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'bulk-add', items })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to bulk add to whitelist')
      }
      
      // Invalidate cache and refetch
      setCache(prev => ({ ...prev, whitelist: null }))
      await fetchWhitelist(false)
      await fetchStats()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk add to whitelist'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchWhitelist, fetchStats])

  // Clear all items
  const clearBlacklist = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/blacklist?batch=true', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'clear-all' })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to clear blacklist')
      }
      
      // Update local state immediately
      setBlacklisted([])
      
      // Invalidate cache and refetch
      setCache(prev => ({ ...prev, blacklist: null }))
      await fetchBlacklist(false)
      await fetchStats()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear blacklist'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchBlacklist, fetchStats])

  const clearWhitelist = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/whitelist?batch=true', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'clear-all' })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to clear whitelist')
      }
      
      // Update local state immediately
      setWhitelisted([])
      
      // Invalidate cache and refetch
      setCache(prev => ({ ...prev, whitelist: null }))
      await fetchWhitelist(false)
      await fetchStats()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear whitelist'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchWhitelist, fetchStats])

  // Check if item is blacklisted/whitelisted
  const isItemBlacklisted = useCallback((item: any) => {
    return blacklisted.some(blacklistedItem => {
      const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
      if (blacklistedItem.type !== itemType) return false
      
      if (blacklistedItem.type === 'video' && 'videoId' in item && blacklistedItem.itemId === item.videoId) return true
      if (blacklistedItem.type === 'playlist' && 'playlistId' in item && blacklistedItem.itemId === item.playlistId) return true
      if (blacklistedItem.type === 'channel' && 'channelId' in item && blacklistedItem.itemId === item.channelId) return true
      
      return blacklistedItem.title.toLowerCase() === item.title?.toLowerCase()
    })
  }, [blacklisted])

  const isItemWhitelisted = useCallback((item: any) => {
    return whitelisted.some(whitelistedItem => {
      const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
      if (whitelistedItem.type !== itemType) return false
      
      if (whitelistedItem.type === 'video' && 'videoId' in item && whitelistedItem.itemId === item.videoId) return true
      if (whitelistedItem.type === 'playlist' && 'playlistId' in item && whitelistedItem.itemId === item.playlistId) return true
      if (whitelistedItem.type === 'channel' && 'channelId' in item && whitelistedItem.itemId === item.channelId) return true
      
      return whitelistedItem.title.toLowerCase() === item.title?.toLowerCase()
    })
  }, [whitelisted])

  // Filter items based on blacklist/whitelist
  const filterItems = useCallback((items: any[]) => {
    if (whitelisted.length > 0) {
      return items.filter(item => isItemWhitelisted(item))
    }
    
    if (blacklisted.length > 0) {
      return items.filter(item => !isItemBlacklisted(item))
    }
    
    return items
  }, [blacklisted, whitelisted, isItemBlacklisted, isItemWhitelisted])

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad) {
      fetchBlacklist()
      fetchWhitelist()
      fetchStats()
    }
  }, [autoLoad, fetchBlacklist, fetchWhitelist, fetchStats])

  return {
    // Data
    blacklisted,
    whitelisted,
    blacklistStats,
    whitelistStats,
    
    // State
    loading,
    error,
    
    // Actions
    fetchBlacklist,
    fetchWhitelist,
    fetchStats,
    addToBlacklist,
    addToWhitelist,
    removeFromBlacklist,
    removeFromWhitelist,
    batchAddToBlacklist,
    batchAddToWhitelist,
    clearBlacklist,
    clearWhitelist,
    
    // Utilities
    isItemBlacklisted,
    isItemWhitelisted,
    filterItems,
    
    // Cache management
    invalidateCache: () => setCache({ blacklist: null, whitelist: null })
  }
}