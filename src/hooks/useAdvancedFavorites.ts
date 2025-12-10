'use client'

import { useState, useCallback, useEffect } from 'react'
import { FavoriteVideo, CreateFavoriteRequest, FavoritesState, FavoriteOperations, FavoriteFilters, FavoriteSortOptions, FavoriteStats, FavoriteCategory } from '@/types/favorites'

const defaultFilters: FavoriteFilters = {}
const defaultSort: FavoriteSortOptions = { field: 'addedAt', direction: 'desc' }

// Default categories
const defaultCategories: FavoriteCategory[] = [
  {
    id: '1',
    name: 'Entertainment',
    description: 'Fun and entertaining videos',
    color: '#ef4444',
    icon: '🎬',
    favoriteIds: [],
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Education',
    description: 'Learning and educational content',
    color: '#3b82f6',
    icon: '📚',
    favoriteIds: [],
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Music',
    description: 'Music videos and performances',
    color: '#8b5cf6',
    icon: '🎵',
    favoriteIds: [],
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Technology',
    description: 'Tech reviews and tutorials',
    color: '#10b981',
    icon: '💻',
    favoriteIds: [],
    createdAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Sports',
    description: 'Sports highlights and matches',
    color: '#f59e0b',
    icon: '⚽',
    favoriteIds: [],
    createdAt: new Date().toISOString()
  }
]

export function useAdvancedFavorites(): FavoritesState & FavoriteOperations & {
  stats: FavoriteStats
  categories: FavoriteCategory[]
  addCategory: (category: Omit<FavoriteCategory, 'id' | 'createdAt'>) => void
  removeCategory: (id: string) => void
  updateCategory: (id: string, category: Partial<FavoriteCategory>) => void
  createPlaylist: (name: string, description?: string, videoIds?: string[]) => Promise<void>
  deletePlaylist: (id: string) => Promise<void>
} {
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FavoriteFilters>(defaultFilters)
  const [sort, setSort] = useState<FavoriteSortOptions>(defaultSort)
  const [enabled, setEnabled] = useState(true)
  const [paused, setPaused] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid')
  const [displaySettings, setDisplaySettings] = useState({
    showThumbnails: true,
    showDuration: true,
    showViewCount: true,
    showRating: true,
    showWatchProgress: true,
    compactMode: false
  })
  const [categories, setCategories] = useState<FavoriteCategory[]>(defaultCategories)

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
          favorite.channelName.toLowerCase().includes(searchQuery) ||
          favorite.tags?.some(tag => tag.toLowerCase().includes(searchQuery)) ||
          favorite.notes?.toLowerCase().includes(searchQuery)
        )
      }
      
      if (customFilters?.channelName || filters.channelName) {
        const channelName = customFilters?.channelName || filters.channelName
        filteredFavorites = filteredFavorites.filter((favorite: FavoriteVideo) => 
          favorite.channelName === channelName
        )
      }
      
      if (customFilters?.isPrivate !== undefined || filters.isPrivate !== undefined) {
        const isPrivate = customFilters?.isPrivate !== undefined ? customFilters.isPrivate : filters.isPrivate
        filteredFavorites = filteredFavorites.filter((favorite: FavoriteVideo) => 
          favorite.isPrivate === isPrivate
        )
      }
      
      if (customFilters?.tags || filters.tags) {
        const filterTags = customFilters?.tags || filters.tags
        if (filterTags && filterTags.length > 0) {
          filteredFavorites = filteredFavorites.filter((favorite: FavoriteVideo) => 
            favorite.tags?.some(tag => filterTags.includes(tag))
          )
        }
      }
      
      if (customFilters?.category || filters.category) {
        const category = customFilters?.category || filters.category
        filteredFavorites = filteredFavorites.filter((favorite: FavoriteVideo) => 
          favorite.category === category
        )
      }
      
      if (customFilters?.rating !== undefined || filters.rating !== undefined) {
        const rating = customFilters?.rating || filters.rating
        filteredFavorites = filteredFavorites.filter((favorite: FavoriteVideo) => 
          favorite.rating === rating
        )
      }
      
      
      
      if (customFilters?.dateRange || filters.dateRange) {
        const dateRange = customFilters?.dateRange || filters.dateRange
        if (dateRange) {
          const startDate = new Date(dateRange.start)
          const endDate = new Date(dateRange.end)
          filteredFavorites = filteredFavorites.filter((favorite: FavoriteVideo) => {
            const addedDate = new Date(favorite.addedAt)
            return addedDate >= startDate && addedDate <= endDate
          })
        }
      }
      
      if (customFilters?.durationRange || filters.durationRange) {
        const durationRange = customFilters?.durationRange || filters.durationRange
        if (durationRange) {
          filteredFavorites = filteredFavorites.filter((favorite: FavoriteVideo) => {
            if (!favorite.duration) return true
            const duration = parseInt(String(favorite.duration).replace(/[^0-9]/g, ''))
            return duration >= durationRange.min && duration <= durationRange.max
          })
        }
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
          return a.title.localeCompare(b.title) * direction
        }
        
        if (field === 'viewCount') {
          const viewsA = typeof a.viewCount === 'number' ? a.viewCount : parseInt(String(a.viewCount || '0'))
          const viewsB = typeof b.viewCount === 'number' ? b.viewCount : parseInt(String(b.viewCount || '0'))
          return (viewsA - viewsB) * direction
        }
        
        if (field === 'rating') {
          const ratingA = a.rating || 0
          const ratingB = b.rating || 0
          return (ratingA - ratingB) * direction
        }
        
        if (field === 'watchProgress') {
          const progressA = a.watchProgress || 0
          const progressB = b.watchProgress || 0
          return (progressA - progressB) * direction
        }
        
        if (field === 'duration') {
          const getDurationSeconds = (duration: string | number | undefined) => {
            if (!duration) return 0
            const durationStr = typeof duration === 'string' ? duration : String(duration)
            const parts = durationStr.split(':').map(Number)
            if (parts.length === 2) return parts[0] * 60 + parts[1]
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
            return 0
          }
          const durationA = getDurationSeconds(a.duration)
          const durationB = getDurationSeconds(b.duration)
          return (durationA - durationB) * direction
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
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  }, [enabled, paused])

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

  const updateFavorite = useCallback(async (videoId: string, data: any): Promise<FavoriteVideo> => {
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to update favorite: ${response.status}`)
      }
      
      const updatedFavorite = await response.json()
      setFavorites(prev => prev.map(fav => fav.videoId === videoId ? updatedFavorite : fav))
      return updatedFavorite
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update favorite'
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
      const favoritesData = favorites?.data || []
      return favoritesData.some((fav: FavoriteVideo) => fav.videoId === videoId)
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

  const batchUpdateFavorites = useCallback(async (updates: Array<{ videoId: string; data: any }>): Promise<FavoriteVideo[]> => {
    if (!enabled) {
      throw new Error('Favorites module is disabled')
    }
    
    if (paused) {
      throw new Error('Favorites functionality is paused')
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const promises = updates.map(({ videoId, data }) => 
        fetch(`/api/favorites/${videoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      )
      
      const responses = await Promise.all(promises)
      const updatedFavorites = await Promise.all(responses.map(res => res.json()))
      
      setFavorites(prev => 
        prev.map(fav => {
          const updated = updatedFavorites.find(uf => uf.videoId === fav.videoId)
          return updated || fav
        })
      )
      
      return updatedFavorites
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to batch update favorites'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [enabled, paused])

  const batchDeleteFavorites = useCallback(async (videoIds: string[]): Promise<void> => {
    if (!enabled) {
      throw new Error('Favorites module is disabled')
    }
    
    if (paused) {
      throw new Error('Favorites functionality is paused')
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const promises = videoIds.map(videoId => 
        fetch(`/api/favorites/${videoId}`, { method: 'DELETE' })
      )
      
      const responses = await Promise.all(promises)
      const errors = responses.filter(res => !res.ok)
      
      if (errors.length > 0) {
        throw new Error(`Failed to delete ${errors.length} favorites`)
      }
      
      setFavorites(prev => prev.filter(fav => !videoIds.includes(fav.videoId)))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to batch delete favorites'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [enabled, paused])

  const exportFavorites = useCallback(async (format: 'json' | 'csv' | 'txt'): Promise<string> => {
    try {
      const response = await fetch(`/api/favorites/export?format=${format}`)
      if (!response.ok) {
        throw new Error(`Failed to export favorites: ${response.status}`)
      }
      
      return await response.text()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export favorites'
      setError(errorMessage)
      throw err
    }
  }, [])

  const importFavorites = useCallback(async (data: string): Promise<FavoriteVideo[]> => {
    try {
      const response = await fetch('/api/favorites/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to import favorites: ${response.status}`)
      }
      
      const importedFavorites = await response.json()
      setFavorites(prev => [...importedFavorites, ...prev])
      return importedFavorites
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import favorites'
      setError(errorMessage)
      throw err
    }
  }, [])

  const addCategory = useCallback((category: Omit<FavoriteCategory, 'id' | 'createdAt'>) => {
    const newCategory: FavoriteCategory = {
      ...category,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setCategories(prev => [...prev, newCategory])
  }, [])

  const removeCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(category => category.id !== id))
  }, [])

  const updateCategory = useCallback((id: string, category: Partial<FavoriteCategory>) => {
    setCategories(prev => 
      prev.map(c => c.id === id ? { ...c, ...category } : c)
    )
  }, [])

  const createPlaylist = useCallback(async (name: string, description?: string, videoIds?: string[]): Promise<void> => {
    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, videoIds })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create playlist: ${response.status}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create playlist'
      setError(errorMessage)
      throw err
    }
  }, [])

  const deletePlaylist = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/playlists/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete playlist: ${response.status}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete playlist'
      setError(errorMessage)
      throw err
    }
  }, [])

  // Calculate stats
  const stats: FavoriteStats = {
    total: favorites.length,
    privateFavorites: favorites.filter(fav => fav.isPrivate).length,
    publicFavorites: favorites.filter(fav => !fav.isPrivate).length,
    averageRating: favorites.length > 0 
      ? favorites.reduce((sum, fav) => sum + (fav.rating || 0), 0) / favorites.length
      : 0,
    totalWatchTime: favorites.reduce((sum, fav) => {
      if (fav.watchProgress && fav.duration) {
        const durationStr = typeof fav.duration === 'string' ? fav.duration : String(fav.duration)
        const duration = parseInt(durationStr.replace(/[^0-9]/g, ''))
        return sum + (duration * (fav.watchProgress / 100))
      }
      return sum
    }, 0),
    categoryStats: favorites.reduce((acc, fav) => {
      if (fav.category) {
        acc[fav.category] = (acc[fav.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>),
    tagStats: favorites.reduce((acc, fav) => {
      fav.tags?.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>),
    ratingStats: {
      1: favorites.filter(fav => fav.rating === 1).length,
      2: favorites.filter(fav => fav.rating === 2).length,
      3: favorites.filter(fav => fav.rating === 3).length,
      4: favorites.filter(fav => fav.rating === 4).length,
      5: favorites.filter(fav => fav.rating === 5).length
    }
  }

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
    viewMode,
    displaySettings,
    stats,
    categories,
    addFavorite,
    removeFavorite,
    fetchFavorites,
    isFavorite,
    toggleFavorite,
    toggleEnabled,
    togglePaused,
    updateFavorite,
    batchUpdateFavorites,
    batchDeleteFavorites,
    exportFavorites,
    importFavorites,
    addCategory,
    removeCategory,
    updateCategory,
    createPlaylist,
    deletePlaylist
  }
}