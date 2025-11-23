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
  priority?: number
  batchId?: string
  videoHash?: string
  channelHash?: string
  isChannelBlock?: boolean
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
  priority?: number
  batchId?: string
  videoHash?: string
  channelHash?: string
  isChannelWhitelist?: boolean
}

interface BlacklistPattern {
  id: string
  pattern: string
  type: 'title' | 'channel' | 'description' | 'tags'
  patternType: 'keyword' | 'regex' | 'wildcard'
  isActive: boolean
  priority: number
  matchCount: number
  lastMatched?: string
  createdAt: string
  updatedAt: string
}

interface FilterRequest {
  items: any[]
  enablePatternMatching?: boolean
  enableChannelBlocking?: boolean
  enablePriorityFiltering?: boolean
  cacheKey?: string
}

interface FilterResult {
  filteredItems: any[]
  blockedCount: number
  whitelistCount: number
  patternMatches: number
  channelBlocks: number
  processingTime: number
  cacheHit?: boolean
}

interface BulkImportRequest {
  items: any[]
  batchName?: string
  description?: string
  source?: 'file' | 'api' | 'manual'
  chunkSize?: number
  skipDuplicates?: boolean
}

interface BulkImportProgress {
  batchId: string
  total: number
  processed: number
  success: number
  failed: number
  isComplete: boolean
  errors: string[]
}

interface UseEnhancedBlacklistOptions {
  autoLoad?: boolean
  cacheTime?: number
  enableMetrics?: boolean
}

export function useEnhancedBlacklist(options: UseEnhancedBlacklistOptions = {}) {
  const { autoLoad = true, cacheTime = 5 * 60 * 1000, enableMetrics = true } = options
  
  const [blacklisted, setBlacklisted] = useState<BlacklistedItem[]>([])
  const [whitelisted, setWhitelisted] = useState<WhitelistedItem[]>([])
  const [patterns, setPatterns] = useState<BlacklistPattern[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Performance metrics
  const [metrics, setMetrics] = useState<any>(null)
  const [lastFilterTime, setLastFilterTime] = useState<number>(0)
  
  // Cache for frequently accessed data
  const [cache, setCache] = useState<{
    blacklist: { data: BlacklistedItem[]; timestamp: number } | null
    whitelist: { data: WhitelistedItem[]; timestamp: number } | null
    patterns: { data: BlacklistPattern[]; timestamp: number } | null
  }>({
    blacklist: null,
    whitelist: null,
    patterns: null
  })

  // Check if cache is still valid
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < cacheTime
  }, [cacheTime])

  // Fetch blacklist with caching
  const fetchBlacklist = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && cache.blacklist && isCacheValid(cache.blacklist.timestamp)) {
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
      setCache(prev => ({ ...prev, blacklist: { data: items, timestamp: Date.now() } }))
      
      return items
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch blacklist'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [cache.blacklist, isCacheValid, cacheTime])

  // Fetch whitelist with caching
  const fetchWhitelist = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && cache.whitelist && isCacheValid(cache.whitelist.timestamp)) {
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
      setCache(prev => ({ ...prev, whitelist: { data: items, timestamp: Date.now() } }))
      
      return items
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch whitelist'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [cache.whitelist, isCacheValid, cacheTime])

  // Fetch patterns with caching
  const fetchPatterns = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && cache.patterns && isCacheValid(cache.patterns.timestamp)) {
      setPatterns(cache.patterns.data)
      return cache.patterns.data
    }

    try {
      const response = await fetch('/api/blacklist/patterns')
      if (!response.ok) throw new Error('Failed to fetch patterns')
      
      const result = await response.json()
      const items = result.patterns || []
      
      setPatterns(items)
      setCache(prev => ({ ...prev, patterns: { data: items, timestamp: Date.now() } }))
      
      return items
    } catch (err) {
      console.error('Failed to fetch patterns:', err)
      return []
    }
  }, [cache.patterns, isCacheValid, cacheTime])

  // Enhanced filtering with performance optimization
  const filterItems = useCallback(async (request: FilterRequest): Promise<FilterResult> => {
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/blacklist/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      
      if (!response.ok) throw new Error('Filtering failed')
      
      const result = await response.json()
      const processingTime = Date.now() - startTime
      setLastFilterTime(processingTime)
      
      return {
        ...result,
        processingTime
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Filtering failed'
      setError(errorMessage)
      
      return {
        filteredItems: request.items,
        blockedCount: 0,
        whitelistCount: 0,
        patternMatches: 0,
        channelBlocks: 0,
        processingTime: Date.now() - startTime
      }
    }
  }, [])

  // Bulk import with progress tracking
  const bulkImport = useCallback(async (
    type: 'blacklist' | 'whitelist',
    request: BulkImportRequest
  ): Promise<{ success: boolean; batchId?: string; error?: string }> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/${type}/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Bulk import failed')
      }
      
      const result = await response.json()
      
      // Invalidate cache and refetch
      setCache(prev => ({ ...prev, blacklist: null, whitelist: null }))
      if (type === 'blacklist') {
        await fetchBlacklist(false)
      } else {
        await fetchWhitelist(false)
      }
      
      return {
        success: true,
        batchId: result.batchId
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bulk import failed'
      setError(errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [fetchBlacklist, fetchWhitelist])

  // Get import progress
  const getImportProgress = useCallback(async (batchId: string): Promise<BulkImportProgress | null> => {
    try {
      const response = await fetch(`/api/blacklist/bulk-import?batchId=${batchId}`)
      if (!response.ok) throw new Error('Failed to get progress')
      
      return await response.json()
    } catch (err) {
      console.error('Failed to get import progress:', err)
      return null
    }
  }, [])

  // Add single item
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
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to blacklist'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchBlacklist])

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
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to whitelist'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchWhitelist])

  // Remove single item
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
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from blacklist'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchBlacklist])

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
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove from whitelist'
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchWhitelist])

  // Performance metrics
  const fetchMetrics = useCallback(async () => {
    if (!enableMetrics) return
    
    try {
      const response = await fetch('/api/blacklist/filter?includeMetrics=true')
      if (!response.ok) throw new Error('Failed to fetch metrics')
      
      const result = await response.json()
      setMetrics(result)
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
    }
  }, [enableMetrics])

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await fetch('/api/blacklist/filter', { method: 'DELETE' })
      setCache({ blacklist: null, whitelist: null, patterns: null })
    } catch (err) {
      console.error('Failed to clear cache:', err)
    }
  }, [])

  // Optimized item checking
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

  // Auto-load data on mount
  useEffect(() => {
    if (autoLoad) {
      fetchBlacklist()
      fetchWhitelist()
      fetchPatterns()
      if (enableMetrics) {
        fetchMetrics()
      }
    }
  }, [autoLoad, fetchBlacklist, fetchWhitelist, fetchPatterns, fetchMetrics, enableMetrics])

  return {
    // Data
    blacklisted,
    whitelisted,
    patterns,
    metrics,
    
    // State
    loading,
    error,
    lastFilterTime,
    
    // Actions
    fetchBlacklist,
    fetchWhitelist,
    fetchPatterns,
    fetchMetrics,
    filterItems,
    bulkImport,
    getImportProgress,
    addToBlacklist,
    addToWhitelist,
    removeFromBlacklist,
    removeFromWhitelist,
    clearCache,
    
    // Utilities
    isItemBlacklisted,
    isItemWhitelisted,
    
    // Cache management
    invalidateCache: () => setCache({ blacklist: null, whitelist: null, patterns: null })
  }
}