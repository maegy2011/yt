'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Video, 
  List, 
  Users,
  Filter,
  X,
  Shield,
  ShieldOff,
  Eye,
  EyeOff
} from 'lucide-react'
import { BlacklistManager } from '@/components/blacklist'

type FilterType = 'all' | 'video' | 'playlist' | 'channel'

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

interface SearchResultsFilterProps {
  searchType: FilterType
  onSearchTypeChange: (type: FilterType) => void
  searchResults: {
    items: any[]
    error?: string
  } | null
  className?: string
  onBlacklistChange?: (blacklisted: BlacklistedItem[]) => void
  onWhitelistChange?: (whitelisted: WhitelistedItem[]) => void
  onAddToBlacklist?: (item: any) => void
  onAddToWhitelist?: (item: any) => void
}

// Simplified API functions
const fetchBlacklistedItems = async (): Promise<BlacklistedItem[]> => {
  try {
    const response = await fetch('/api/blacklist')
    if (!response.ok) throw new Error('Failed to fetch blacklist')
    const result = await response.json()
    return result.items || []
  } catch (error) {
    console.error('Error fetching blacklist:', error)
    return []
  }
}

const fetchWhitelistedItems = async (): Promise<WhitelistedItem[]> => {
  try {
    const response = await fetch('/api/whitelist')
    if (!response.ok) throw new Error('Failed to fetch whitelist')
    const result = await response.json()
    return result.items || []
  } catch (error) {
    console.error('Error fetching whitelist:', error)
    return []
  }
}

const addToBlacklist = async (item: BlacklistedItem): Promise<boolean> => {
  try {
    const response = await fetch('/api/blacklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    return response.ok
  } catch (error) {
    console.error('Error adding to blacklist:', error)
    return false
  }
}

const addToWhitelist = async (item: WhitelistedItem): Promise<boolean> => {
  try {
    const response = await fetch('/api/whitelist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    return response.ok
  } catch (error) {
    console.error('Error adding to whitelist:', error)
    return false
  }
}

export function SearchResultsFilter({ 
  searchType, 
  onSearchTypeChange, 
  searchResults,
  className = '',
  onBlacklistChange,
  onWhitelistChange,
  onAddToBlacklist,
  onAddToWhitelist
}: SearchResultsFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showBlacklistManager, setShowBlacklistManager] = useState(false)
  const [showWhitelistManager, setShowWhitelistManager] = useState(false)
  const [blacklisted, setBlacklisted] = useState<BlacklistedItem[]>([])
  const [whitelisted, setWhitelisted] = useState<WhitelistedItem[]>([])

  // Load blacklisted/whitelisted items from database on mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        const [blacklistedData, whitelistedData] = await Promise.all([
          fetchBlacklistedItems(),
          fetchWhitelistedItems()
        ])
        setBlacklisted(blacklistedData)
        setWhitelisted(whitelistedData)
        onBlacklistChange?.(blacklistedData)
        onWhitelistChange?.(whitelistedData)
      } catch (error) {
        console.error('Error loading blacklisted/whitelisted items:', error)
      }
    }
    
    loadItems()
  }, [])

  // Refresh function to reload data from database
  const refreshLists = useCallback(async () => {
    try {
      const [blacklistedData, whitelistedData] = await Promise.all([
        fetchBlacklistedItems(),
        fetchWhitelistedItems()
      ])
      setBlacklisted(blacklistedData)
      setWhitelisted(whitelistedData)
      onBlacklistChange?.(blacklistedData)
      onWhitelistChange?.(whitelistedData)
    } catch (error) {
      console.error('Error refreshing blacklisted/whitelisted items:', error)
    }
  }, [onBlacklistChange, onWhitelistChange])

  // Update parent when lists change
  useEffect(() => {
    onBlacklistChange?.(blacklisted)
  }, [blacklisted, onBlacklistChange])

  useEffect(() => {
    onWhitelistChange?.(whitelisted)
  }, [whitelisted, onWhitelistChange])

  // Calculate counts for each type
  const counts = {
    all: searchResults?.items.length || 0,
    video: searchResults?.items.filter(item => (item as any).type === 'video').length || 0,
    playlist: searchResults?.items.filter(item => (item as any).type === 'playlist').length || 0,
    channel: searchResults?.items.filter(item => (item as any).type === 'channel').length || 0
  }

  const filterOptions = [
    {
      id: 'all' as FilterType,
      label: 'All',
      icon: Filter,
      count: counts.all,
      description: 'Show all results'
    },
    {
      id: 'video' as FilterType,
      label: 'Videos',
      icon: Video,
      count: counts.video,
      description: 'Show only videos'
    },
    {
      id: 'playlist' as FilterType,
      label: 'Playlists',
      icon: List,
      count: counts.playlist,
      description: 'Show only playlists'
    },
    {
      id: 'channel' as FilterType,
      label: 'Channels',
      icon: Users,
      count: counts.channel,
      description: 'Show only channels'
    }
  ]

  const handleFilterChange = (type: FilterType) => {
    onSearchTypeChange(type)
    // Auto-collapse on mobile after selection
    if (window.innerWidth < 768) {
      setIsExpanded(false)
    }
  }

  // Add search result items to blacklist/whitelist
  const addSearchResultToBlacklist = async (item: any) => {
    const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
    if (itemType === 'unknown') return
    
    const itemId = 'videoId' in item ? item.videoId : 'playlistId' in item ? item.playlistId : item.channelId
    
    const blacklistItem = {
      itemId,
      title: item.title || item.channelName || 'Unknown',
      type: itemType,
      thumbnail: item.thumbnail,
      channelName: item.channelName
    }
    
    const success = await addToBlacklist(blacklistItem)
    if (success) {
      // Refresh lists from database to get server-generated data
      await refreshLists()
    }
    
    // Also call parent callback to update main app state
    onAddToBlacklist?.(item)
  }

  const addSearchResultToWhitelist = async (item: any) => {
    const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
    if (itemType === 'unknown') return
    
    const itemId = 'videoId' in item ? item.videoId : 'playlistId' in item ? item.playlistId : item.channelId
    
    const whitelistItem = {
      itemId,
      title: item.title || item.channelName || 'Unknown',
      type: itemType,
      thumbnail: item.thumbnail,
      channelName: item.channelName
    }
    
    const success = await addToWhitelist(whitelistItem)
    if (success) {
      // Refresh lists from database to get server-generated data
      await refreshLists()
    }
    
    // Also call parent callback to update main app state
    onAddToWhitelist?.(item)
  }

  const isItemBlacklisted = (item: any) => {
    return blacklisted.some(blacklistedItem => {
      // Check by type match
      const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
      if (blacklistedItem.type !== itemType) return false
      
      // PRIMARY: Check by YouTube ID matching
      if (blacklistedItem.type === 'video' && 'videoId' in item && blacklistedItem.itemId === item.videoId) return true
      if (blacklistedItem.type === 'playlist' && 'playlistId' in item && blacklistedItem.itemId === item.playlistId) return true
      if (blacklistedItem.type === 'channel' && 'channelId' in item && blacklistedItem.itemId === item.channelId) return true
      
      // FALLBACK: Check by title match
      return blacklistedItem.title.toLowerCase() === item.title?.toLowerCase()
    })
  }

  const isItemWhitelisted = (item: any) => {
    return whitelisted.some(whitelistedItem => {
      // Check by type match
      const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
      if (whitelistedItem.type !== itemType) return false
      
      // PRIMARY: Check by YouTube ID matching
      if (whitelistedItem.type === 'video' && 'videoId' in item && whitelistedItem.itemId === item.videoId) return true
      if (whitelistedItem.type === 'playlist' && 'playlistId' in item && whitelistedItem.itemId === item.playlistId) return true
      if (whitelistedItem.type === 'channel' && 'channelId' in item && whitelistedItem.itemId === item.channelId) return true
      
      // FALLBACK: Check by title match
      return whitelistedItem.title.toLowerCase() === item.title?.toLowerCase()
    })
  }

  // Filter results based on blacklist/whitelist
  const getFilteredResults = () => {
    if (!searchResults?.items) return searchResults
    
    // If whitelist has items, only show whitelisted content
    if (whitelisted.length > 0) {
      return {
        ...searchResults,
        items: searchResults.items.filter(item => isItemWhitelisted(item))
      }
    }
    
    // If blacklist has items, exclude blacklisted content
    if (blacklisted.length > 0) {
      return {
        ...searchResults,
        items: searchResults.items.filter(item => !isItemBlacklisted(item))
      }
    }
    
    return searchResults
  }

  const filteredResults = getFilteredResults()

  return (
    <>
      <div className={`bg-background border border-border rounded-xl shadow-sm ${className}`}>
        {/* Status Indicators and Controls */}
        {searchResults?.items && searchResults.items.length > 0 && (
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              {blacklisted.length > 0 && (
                <div className="flex items-center gap-2">
                  <ShieldOff className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">
                    {blacklisted.length} Blacklisted
                  </span>
                </div>
              )}
              {whitelisted.length > 0 && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    {whitelisted.length} Whitelisted
                  </span>
                </div>
              )}
              {blacklisted.length === 0 && whitelisted.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  Filter search results
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBlacklistManager(true)}
                className="h-11 min-h-[44px] px-3 touch-manipulation mobile-touch-feedback"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Blacklist</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWhitelistManager(true)}
                className="h-11 min-h-[44px] px-3 touch-manipulation mobile-touch-feedback"
              >
                <Eye className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Whitelist</span>
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Toggle Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full h-11 min-h-[44px] flex items-center justify-between px-4 touch-manipulation mobile-touch-feedback"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filter</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filterOptions.find(opt => opt.id === searchType)?.label}
              </span>
              {isExpanded ? (
                <X className="w-4 h-4" />
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="w-1 h-1 bg-foreground rounded-sm" />
                  <div className="w-1 h-1 bg-foreground rounded-sm" />
                </div>
              )}
            </div>
          </Button>
        </div>

        {/* Filter Options */}
        <div className={`${isExpanded ? 'block' : 'hidden'} md:block`}>
          {/* Desktop Layout - Horizontal */}
          <div className="hidden md:flex items-center gap-1 p-2">
            {filterOptions.map((option) => {
              const Icon = option.icon
              const isActive = searchType === option.id
              
              return (
                <Button
                  key={option.id}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleFilterChange(option.id)}
                  className={`flex items-center gap-2 h-11 min-h-[44px] px-3 touch-manipulation mobile-touch-feedback ${
                    isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  title={option.description}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{option.label}</span>
                  <Badge variant={isActive ? 'secondary' : 'outline'} className="text-xs">
                    {option.count}
                  </Badge>
                </Button>
              )
            })}
          </div>

          {/* Mobile Layout - Vertical */}
          <div className="md:hidden p-2 space-y-1">
            {filterOptions.map((option) => {
              const Icon = option.icon
              const isActive = searchType === option.id
              
              return (
                <Button
                  key={option.id}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleFilterChange(option.id)}
                  className={`w-full flex items-center justify-between h-11 min-h-[44px] px-3 touch-manipulation mobile-touch-feedback ${
                    isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <Badge variant={isActive ? 'secondary' : 'outline'} className="text-xs">
                    {option.count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Blacklist Manager Dialog */}
      <BlacklistManager
        isOpen={showBlacklistManager}
        onClose={() => setShowBlacklistManager(false)}
        type="blacklist"
      />

      {/* Whitelist Manager Dialog */}
      <BlacklistManager
        isOpen={showWhitelistManager}
        onClose={() => setShowWhitelistManager(false)}
        type="whitelist"
      />
    </>
  )
}