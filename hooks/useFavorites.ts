'use client'

import { useState, useCallback, useEffect } from 'react'
import { FavoriteVideo, CreateFavoriteRequest, UpdateFavoriteRequest, FavoritesState, FavoriteOperations, FavoriteFilters, FavoriteSortOptions } from '@/types/favorites'
import { useIncognito } from '@/contexts/incognito-context'
import { addIncognitoHeaders } from '@/lib/incognito-utils'

const defaultFilters: FavoriteFilters = {}
const defaultSort: FavoriteSortOptions = { field: 'addedAt', direction: 'desc' }

export function useFavorites(): FavoritesState & FavoriteOperations {
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FavoriteFilters>(defaultFilters)
  const [sort, setSort] = useState<FavoriteSortOptions>(defaultSort)
  const [enabled, setEnabled] = useState(true)
  const [paused, setPaused] = useState(false)
  const { isIncognito } = useIncognito()

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedEnabled = localStorage.getItem('mytube-favorites-enabled')
    const savedPaused = localStorage.getItem('mytube-favorites-paused')
    
    if (savedEnabled !== null) {
      setEnabled(savedEnabled === 'true')
    }
    
    if (savedPaused !== null) {
      setPaused(savedPaused === 'true')
    }
  }, [])

  const fetchFavorites = useCallback(async (customFilters?: FavoriteFilters): Promise<FavoriteVideo[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/favorites')
      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.status} ${response.statusText}`)
      }
      
      const allFavorites = await response.json()
      
      // Extract the data array from the API response
      const favoritesData = allFavorites?.data || []
      
      // Apply filters
      let filteredFavorites = favoritesData
      
      if (customFilters?.searchQuery || filters.searchQuery) {
        const searchQuery = (customFilters?.searchQuery || filters.searchQuery)?.toLowerCase() || ''
        filteredFavorites = favoritesData.filter((favorite: FavoriteVideo) => 
          favorite.title.toLowerCase().includes(searchQuery) ||
          favorite.channelName.toLowerCase().includes(searchQuery)
        )
      }
      
      if (customFilters?.channelName || filters.channelName) {
        const channelName = customFilters?.channelName || filters.channelName
        filteredFavorites = filteredFavorites.filter((favorite: FavoriteVideo) => 
          favorite.channelName === channelName
        )
      }
      
      // Apply sorting
      filteredFavorites.sort((a: FavoriteVideo, b: FavoriteVideo) => {
        const field = sort.field
        const direction = sort.direction === 'asc' ? 1 : -1
        
        if (field === 'addedAt' || field === 'updatedAt') {
          const dateA = new Date(a[field]).getTime()
          const dateB = new Date(b[field]).getTime()
          return (dateA - dateB) * direction
        }
        
        if (field === 'title') {
          return a[field].localeCompare(b[field]) * direction
        }
        
        if (field === 'viewCount') {
          const viewA = typeof a[field] === 'number' ? a[field] : parseInt(String(a[field] || '0'))
          const viewB = typeof b[field] === 'number' ? b[field] : parseInt(String(b[field] || '0'))
          return (viewA - viewB) * direction
        }
        
        return 0
      })
      
      setFavorites(filteredFavorites)
      return filteredFavorites
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch favorites'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [filters, sort])

  const addFavorite = useCallback(async (data: CreateFavoriteRequest): Promise<FavoriteVideo> => {
    if (!enabled) {
      throw new Error('Favorites module is disabled')
    }
    
    if (paused) {
      throw new Error('Favorites functionality is paused')
    }
    
    if (isIncognito) {
      throw new Error('Favorites are disabled in incognito mode')
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(addIncognitoHeaders({}, isIncognito).headers || {})
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to add favorite: ${response.status}`)
      }
      
      const newFavorite = await response.json()
      setFavorites(prev => [newFavorite, ...prev])
      return newFavorite
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add favorite'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [enabled, paused, isIncognito])

  const removeFavorite = useCallback(async (videoId: string): Promise<void> => {
    if (!enabled) {
      throw new Error('Favorites module is disabled')
    }
    
    if (paused) {
      throw new Error('Favorites functionality is paused')
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/favorites/${videoId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to remove favorite: ${response.status}`)
      }
      
      setFavorites(prev => prev.filter(fav => fav.videoId !== videoId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove favorite'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [enabled, paused])

  const isFavorite = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/favorites')
      if (!response.ok) {
        return false
      }
      
      const favorites = await response.json()
      return favorites.some((fav: FavoriteVideo) => fav.videoId === videoId)
    } catch {
      return false
    }
  }, [])

  const toggleFavorite = useCallback(async (videoData: CreateFavoriteRequest): Promise<void> => {
    try {
      const isCurrentlyFavorite = await isFavorite(videoData.videoId)
      
      if (isCurrentlyFavorite) {
        await removeFavorite(videoData.videoId)
      } else {
        await addFavorite(videoData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle favorite'
      setError(errorMessage)
      throw err
    }
  }, [isFavorite, removeFavorite, addFavorite])

  const toggleEnabled = useCallback((newEnabled: boolean) => {
    setEnabled(newEnabled)
    localStorage.setItem('mytube-favorites-enabled', newEnabled.toString())
  }, [])

  const togglePaused = useCallback((newPaused: boolean) => {
    setPaused(newPaused)
    localStorage.setItem('mytube-favorites-paused', newPaused.toString())
  }, [])

  // Load favorites on mount
  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  return {
    favorites,
    loading,
    error,
    filters,
    sort,
    enabled,
    paused,
    viewMode: 'grid' as const,
    displaySettings: {
      showThumbnails: true,
      showDuration: true,
      showViewCount: true,
      showRating: false,
      showWatchProgress: true,
      compactMode: false
    },
    addFavorite,
    removeFavorite,
    updateFavorite: async (videoId: string, data: UpdateFavoriteRequest) => {
      // Placeholder implementation
      const favorite = favorites.find(f => f.videoId === videoId)
      if (favorite) {
        Object.assign(favorite, data)
        setFavorites([...favorites])
      }
      return favorite as FavoriteVideo
    },
    batchUpdateFavorites: async (updates) => {
      // Placeholder implementation
      updates.forEach(({ videoId, data }) => {
        const favorite = favorites.find(f => f.videoId === videoId)
        if (favorite) {
          Object.assign(favorite, data)
        }
      })
      setFavorites([...favorites])
      return updates.map(u => favorites.find(f => f.videoId === u.videoId) as FavoriteVideo)
    },
    batchDeleteFavorites: async (videoIds) => {
      // Placeholder implementation
      setFavorites(favorites.filter(f => !videoIds.includes(f.videoId)))
    },
    exportFavorites: async (format) => {
      // Placeholder implementation
      return JSON.stringify(favorites, null, 2)
    },
    importFavorites: async (data) => {
      // Placeholder implementation
      try {
        const imported = JSON.parse(data)
        setFavorites([...favorites, ...imported])
        return imported
      } catch {
        return []
      }
    },
    fetchFavorites,
    isFavorite,
    toggleFavorite,
    toggleEnabled,
    togglePaused
  }
}