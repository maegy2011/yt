'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShieldOff,
  Eye,
  EyeOff
} from 'lucide-react'
import { BlacklistManager } from '@/components/blacklist'
import { BlacklistedItem as BlacklistedItemType, WhitelistedItem as WhitelistedItemType } from '@/types'

type FilterType = 'all' | 'video' | 'playlist' | 'channel'

interface SearchResultsFilterProps {
  items: any[]
  error?: string
  className?: string
  onBlacklistChange?: (blacklisted: BlacklistedItemType[]) => void
  onWhitelistChange?: (whitelisted: WhitelistedItemType[]) => void
  onAddToBlacklist?: (item: any) => void
  onAddToWhitelist?: (item: any) => void
}

export function SearchResultsFilterEnhanced({ 
  items, 
  error, 
  className = '',
  onBlacklistChange,
  onWhitelistChange,
  onAddToBlacklist,
  onAddToWhitelist
}: SearchResultsFilterProps) {
  const [searchType, setSearchType] = useState<FilterType>('all')
  const [isExpanded, setIsExpanded] = useState(false)
  const [blacklistedItems, setBlacklistedItems] = useState<BlacklistedItemType[]>([])
  const [whitelistedItems, setWhitelistedItems] = useState<WhitelistedItemType[]>([])

  // Fetch blacklist/whitelist data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [blacklisted, whitelisted] = await Promise.all([
          BlacklistManager.fetchBlacklistedItems(),
          BlacklistManager.fetchWhitelistedItems()
        ])
        
        setBlacklistedItems(blacklisted)
        setWhitelistedItems(whitelisted)
        
        // Call parent callbacks with server-generated data
        onBlacklistChange?.(blacklisted)
        onWhitelistChange?.(whitelisted)
      } catch (err) {
        console.error('Failed to fetch blacklist/whitelist data:', err)
      }
    }

    fetchData()
  }, [])

  // Filter items based on search type
  const filteredItems = items.filter(item => {
    if (searchType === 'all') return true
    
    const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
    if (itemType === 'unknown') return false
    
    return searchType === itemType
  })

  // Add search result items to blacklist/whitelist
  const addSearchResultToBlacklist = async (item: any) => {
    const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
    if (itemType === 'unknown') return
    
    const itemId = 'videoId' in item ? item.videoId : 'playlistId' in item ? item.playlistId : item.channelId
    
    const blacklistItem: BlacklistedItemType = {
      id: `temp-${Date.now()}`, // Temporary ID
      itemId,
      title: item.title || item.channelName || 'Unknown',
      type: itemType,
      thumbnail: item.thumbnail,
      channelName: item.channelName,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const success = await BlacklistManager.addToBlacklist(blacklistItem)
    if (success) {
      // Refresh lists from database to get server-generated data
      await fetchData()
    }
    
    // Also call parent callback to update main app state
    onAddToBlacklist?.(blacklistItem as BlacklistedItemType)
  }

  const addSearchResultToWhitelist = async (item: any) => {
    const itemType = 'videoId' in item ? 'video' : 'playlistId' in item ? 'playlist' : 'channelId' in item ? 'channel' : 'unknown'
    if (itemType === 'unknown') return
    
    const itemId = 'videoId' in item ? item.videoId : 'playlistId' in item ? item.playlistId : item.channelId
    
    const whitelistItem: WhitelistedItemType = {
      id: `temp-${Date.now()}`, // Temporary ID
      itemId,
      title: item.title || item.channelName || 'Unknown',
      type: itemType,
      thumbnail: item.thumbnail,
      channelName: item.channelName,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const success = await BlacklistManager.addToWhitelist(whitelistItem)
    if (success) {
      // Refresh lists from database to get server-generated data
      await fetchData()
    }
    
    // Also call parent callback to update main app state
    onAddToWhitelist?.(whitelistItem as WhitelistedItemType)
  }

  const isItemBlacklisted = (item: any) => {
    return blacklistedItems.some(blacklistedItem => 
      blacklistedItem.itemId === ('videoId' in item ? item.videoId : 'playlistId' in item ? item.playlistId : item.channelId)
    )
  }

  const isItemWhitelisted = (item: any) => {
    return whitelistedItems.some(whitelistedItem => 
      whitelistedItem.itemId === ('videoId' in item ? item.videoId : 'playlistId' in item ? item.playlistId : item.channelId)
    )
  }

  // Auto-collapse on mobile after selection
  if (window.innerWidth < 768) {
    setIsExpanded(false)
  }
  
  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={searchType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchType('all')}
        >
          All
        </Button>
        <Button
          variant={searchType === 'video' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchType('video')}
        >
          Videos
        </Button>
        <Button
          variant={searchType === 'playlist' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchType('playlist')}
        >
          Playlists
        </Button>
        <Button
          variant={searchType === 'channel' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSearchType('channel')}
        >
          Channels
        </Button>
      </div>

      {/* Blacklist Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldOff className="w-5 h-5" />
            Blacklist ({blacklistedItems.length})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.title || item.channelName || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.type === 'video' && `Video ID: ${item.videoId}`}
                    {item.type === 'playlist' && `Playlist ID: ${item.playlistId}`}
                    {item.type === 'channel' && `Channel ID: ${item.channelId}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => addSearchResultToWhitelist(item)}
                    disabled={isItemWhitelisted(item)}
                  >
                    Whitelist
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => addSearchResultToBlacklist(item)}
                    disabled={isItemBlacklisted(item)}
                  >
                    Blacklist
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Whitelist Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Whitelist ({whitelistedItems.length})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.title || item.channelName || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.type === 'video' && `Video ID: ${item.videoId}`}
                    {item.type === 'playlist' && `Playlist ID: ${item.playlistId}`}
                    {item.type === 'channel' && `Channel ID: ${item.channelId}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSearchResultToWhitelist(item)}
                    disabled={isItemWhitelisted(item)}
                  >
                    Whitelist
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSearchResultToBlacklist(item)}
                    disabled={isItemBlacklisted(item)}
                  >
                    Blacklist
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <h4 className="font-semibold mb-2">Blacklisted Items</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total:</span>
              <Badge variant="destructive">{blacklistedItems.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Videos:</span>
              <Badge variant="outline">
                {blacklistedItems.filter(item => item.type === 'video').length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Playlists:</span>
              <Badge variant="outline">
                {blacklistedItems.filter(item => item.type === 'playlist').length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Channels:</span>
              <Badge variant="outline">
                {blacklistedItems.filter(item => item.type === 'channel').length}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h4 className="font-semibold mb-2">Whitelisted Items</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total:</span>
              <Badge variant="default">{whitelistedItems.length}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Videos:</span>
              <Badge variant="outline">
                {whitelistedItems.filter(item => item.type === 'video').length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Playlists:</span>
              <Badge variant="outline">
                {whitelistedItems.filter(item => item.type === 'playlist').length}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Channels:</span>
              <Badge variant="outline">
                {whitelistedItems.filter(item => item.type === 'channel').length}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}