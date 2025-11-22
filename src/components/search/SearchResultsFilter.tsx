'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { 
  Video, 
  List, 
  Play, 
  Users,
  Filter,
  X,
  Plus,
  Trash2,
  Shield,
  ShieldOff,
  Eye,
  EyeOff
} from 'lucide-react'

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

// Database API functions
const fetchBlacklistedItems = async (): Promise<BlacklistedItem[]> => {
  try {
    const response = await fetch('/api/blacklist')
    if (!response.ok) throw new Error('Failed to fetch blacklist')
    return await response.json()
  } catch (error) {
    console.error('Error fetching blacklist:', error)
    return []
  }
}

const fetchWhitelistedItems = async (): Promise<WhitelistedItem[]> => {
  try {
    const response = await fetch('/api/whitelist')
    if (!response.ok) throw new Error('Failed to fetch whitelist')
    return await response.json()
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

const removeFromBlacklist = async (itemId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/blacklist?itemId=${encodeURIComponent(itemId)}`, {
      method: 'DELETE'
    })
    return response.ok
  } catch (error) {
    console.error('Error removing from blacklist:', error)
    return false
  }
}

const removeFromWhitelist = async (itemId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/whitelist?itemId=${encodeURIComponent(itemId)}`, {
      method: 'DELETE'
    })
    return response.ok
  } catch (error) {
    console.error('Error removing from whitelist:', error)
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
  const [showBlacklistDialog, setShowBlacklistDialog] = useState(false)
  const [showWhitelistDialog, setShowWhitelistDialog] = useState(false)
  const [blacklisted, setBlacklisted] = useState<BlacklistedItem[]>([])
  const [whitelisted, setWhitelisted] = useState<WhitelistedItem[]>([])
  const [newBlacklistItem, setNewBlacklistItem] = useState('')
  const [newWhitelistItem, setNewWhitelistItem] = useState('')

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

  // Update parent when lists change
  useEffect(() => {
    onBlacklistChange?.(blacklisted)
  }, [blacklisted])

  useEffect(() => {
    onWhitelistChange?.(whitelisted)
  }, [whitelisted])

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

  const addBlacklistItem = async () => {
    if (newBlacklistItem.trim()) {
      const item: BlacklistedItem = {
        id: Date.now().toString(),
        itemId: Date.now().toString(),
        title: newBlacklistItem.trim(),
        type: 'video' as any, // Default to video type
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const success = await addToBlacklist(item)
      if (success) {
        setBlacklisted(prev => [...prev, item])
        setNewBlacklistItem('')
      }
    }
  }

  const addWhitelistItem = async () => {
    if (newWhitelistItem.trim()) {
      const item: WhitelistedItem = {
        id: Date.now().toString(),
        itemId: Date.now().toString(),
        title: newWhitelistItem.trim(),
        type: 'video' as any, // Default to video type
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const success = await addToWhitelist(item)
      if (success) {
        setWhitelisted(prev => [...prev, item])
        setNewWhitelistItem('')
      }
    }
  }

  const removeBlacklistItem = async (itemId: string) => {
    const success = await removeFromBlacklist(itemId)
    if (success) {
      setBlacklisted(prev => prev.filter(item => item.itemId !== itemId))
    }
  }

  const removeWhitelistItem = async (itemId: string) => {
    const success = await removeFromWhitelist(itemId)
    if (success) {
      setWhitelisted(prev => prev.filter(item => item.itemId !== itemId))
    }
  }

  // Add search result items to blacklist/whitelist
  const addSearchResultToBlacklist = async (item: any) => {
    const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
    if (itemType === 'unknown') return
    
    const blacklistItem: BlacklistedItem = {
      id: 'videoId' in item ? item.videoId : 'playlistId' in item ? item.playlistId : item.channelId,
      itemId: 'videoId' in item ? item.videoId : 'playlistId' in item ? item.playlistId : item.channelId,
      title: item.title || item.channelName || 'Unknown',
      type: itemType,
      thumbnail: item.thumbnail,
      channelName: item.channelName,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const success = await addToBlacklist(blacklistItem)
    if (success) {
      setBlacklisted(prev => {
        // Check if already exists
        if (prev.some(existing => existing.itemId === blacklistItem.itemId && existing.type === blacklistItem.type)) {
          return prev
        }
        return [...prev, blacklistItem]
      })
    }
    
    // Also call parent callback to update main app state
    onAddToBlacklist?.(item)
  }

  const addSearchResultToWhitelist = async (item: any) => {
    const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
    if (itemType === 'unknown') return
    
    const whitelistItem: WhitelistedItem = {
      id: 'videoId' in item ? item.videoId : 'playlistId' in item ? item.playlistId : item.channelId,
      itemId: 'videoId' in item ? item.videoId : 'playlistId' in item ? item.playlistId : item.channelId,
      title: item.title || item.channelName || 'Unknown',
      type: itemType,
      thumbnail: item.thumbnail,
      channelName: item.channelName,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const success = await addToWhitelist(whitelistItem)
    if (success) {
      setWhitelisted(prev => {
        // Check if already exists
        if (prev.some(existing => existing.itemId === whitelistItem.itemId && existing.type === whitelistItem.type)) {
          return prev
        }
        return [...prev, whitelistItem]
      })
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
              onClick={() => setShowBlacklistDialog(true)}
              className="h-11 min-h-[44px] px-3 touch-manipulation mobile-touch-feedback"
            >
              <EyeOff className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Blacklist</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWhitelistDialog(true)}
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
            const hasResults = option.count > 0

            return (
              <Button
                key={option.id}
                variant={isActive ? 'default' : 'ghost'}
                onClick={() => handleFilterChange(option.id)}
                disabled={!hasResults}
                className={`h-11 min-h-[44px] px-4 flex items-center gap-2 touch-manipulation mobile-touch-feedback transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : hasResults
                    ? 'hover:bg-muted/50 hover:text-foreground'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                title={option.description}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{option.label}</span>
                {option.count > 0 && (
                  <Badge 
                    variant={isActive ? 'secondary' : 'outline'}
                    className="ml-1 text-xs"
                  >
                    {option.count}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>

        {/* Mobile Layout - Vertical List */}
        <div className="md:hidden">
          <div className="p-2 space-y-1">
            {filterOptions.map((option) => {
              const Icon = option.icon
              const isActive = searchType === option.id
              const hasResults = option.count > 0

              return (
                <Button
                  key={option.id}
                  variant={isActive ? 'default' : 'ghost'}
                  onClick={() => handleFilterChange(option.id)}
                  disabled={!hasResults}
                  className={`w-full h-12 min-h-[48px] px-4 flex items-center justify-between touch-manipulation mobile-touch-feedback transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : hasResults
                      ? 'hover:bg-muted/50 hover:text-foreground'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  title={option.description}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-base">{option.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {option.count > 0 && (
                      <Badge 
                        variant={isActive ? 'secondary' : 'outline'}
                        className="text-sm"
                      >
                        {option.count}
                      </Badge>
                    )}
                    {isActive && (
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    )}
                  </div>
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Blacklist Dialog */}
      <Dialog open={showBlacklistDialog} onOpenChange={setShowBlacklistDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="w-5 h-5 text-destructive" />
              Blacklist Management
            </DialogTitle>
            <DialogDescription>
              Manage your blacklisted videos, channels, and playlists. Blacklisted items will be hidden from search results.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add to Blacklist */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add to Blacklist</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter title to blacklist..."
                  value={newBlacklistItem}
                  onChange={(e) => setNewBlacklistItem(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addBlacklistItem()
                    }
                  }}
                  className="flex-1 h-11 min-h-[44px] px-3"
                />
                <Button
                  onClick={addBlacklistItem}
                  disabled={!newBlacklistItem.trim()}
                  className="h-11 min-h-[44px] px-4 touch-manipulation mobile-touch-feedback"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Blacklisted Items */}
            {blacklisted.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Blacklisted Items</h3>
                  <span className="text-xs text-muted-foreground">{blacklisted.length} items</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {blacklisted.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.type} • {new Date(item.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlacklistItem(item.itemId)}
                        className="h-8 w-8 min-h-[32px] p-0 touch-manipulation mobile-touch-feedback text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Remove from blacklist"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShieldOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No blacklisted items</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBlacklistDialog(false)}
              className="w-full h-11 min-h-[44px] touch-manipulation mobile-touch-feedback"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Whitelist Dialog */}
      <Dialog open={showWhitelistDialog} onOpenChange={setShowWhitelistDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Whitelist Management
            </DialogTitle>
            <DialogDescription>
              Manage your whitelisted videos, channels, and playlists. When whitelist is active, only whitelisted items will be shown.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add to Whitelist */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add to Whitelist</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter title to whitelist..."
                  value={newWhitelistItem}
                  onChange={(e) => setNewWhitelistItem(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addWhitelistItem()
                    }
                  }}
                  className="flex-1 h-11 min-h-[44px] px-3"
                />
                <Button
                  onClick={addWhitelistItem}
                  disabled={!newWhitelistItem.trim()}
                  className="h-11 min-h-[44px] px-4 touch-manipulation mobile-touch-feedback"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Whitelisted Items */}
            {whitelisted.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Whitelisted Items</h3>
                  <span className="text-xs text-muted-foreground">{whitelisted.length} items</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {whitelisted.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          {item.type} • {new Date(item.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWhitelistItem(item.itemId)}
                        className="h-8 w-8 min-h-[32px] p-0 touch-manipulation mobile-touch-feedback text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Remove from whitelist"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No whitelisted items</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWhitelistDialog(false)}
              className="w-full h-11 min-h-[44px] touch-manipulation mobile-touch-feedback"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}