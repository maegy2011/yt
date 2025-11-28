'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Users, 
  Search, 
  Plus, 
  ExternalLink, 
  Play,
  Video,
  TrendingUp,
  Settings,
  RefreshCw,
  Trash2,
  Shield,
  ShieldOff
} from 'lucide-react'
import { ScrollingChannelBar } from './ScrollingChannelBar'
import type { FavoriteChannel } from '@/types/favorites'

interface ChannelsContainerProps {
  className?: string
  onChannelSelect?: (channel: FavoriteChannel) => void
  onAddToBlacklist?: (channel: FavoriteChannel) => void
  onAddToWhitelist?: (channel: FavoriteChannel) => void
  isBlacklisted?: (channelId: string) => boolean
  isWhitelisted?: (channelId: string) => boolean
}

export function ChannelsContainer({ 
  className = '', 
  onChannelSelect,
  onAddToBlacklist,
  onAddToWhitelist,
  isBlacklisted = () => false,
  isWhitelisted = () => false
}: ChannelsContainerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState<'scroll' | 'grid' | 'list'>('scroll')
  const [favoriteChannels, setFavoriteChannels] = useState<FavoriteChannel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Fetch channels from API
  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/channels')
      if (!response.ok) {
        throw new Error(`Failed to fetch channels: ${response.status}`)
      }
      const channels = await response.json()
      setFavoriteChannels(channels)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch channels')
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle blacklist
  const handleAddToBlacklist = useCallback((channel: FavoriteChannel) => {
    if (onAddToBlacklist) {
      onAddToBlacklist(channel)
    }
  }, [onAddToBlacklist])

  // Handle whitelist
  const handleAddToWhitelist = useCallback((channel: FavoriteChannel) => {
    if (onAddToWhitelist) {
      onAddToWhitelist(channel)
    }
  }, [onAddToWhitelist])

  // Remove channel
  const removeChannel = useCallback(async (channelId: string) => {
    try {
      const response = await fetch(`/api/channels/${channelId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error(`Failed to remove channel: ${response.status}`)
      }
      setFavoriteChannels(prev => prev.filter(channel => channel.channelId !== channelId))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove channel')
    }
  }, [])

  // Filter channels
  const filteredChannels = favoriteChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleChannelClick = useCallback((channel: FavoriteChannel) => {
    if (onChannelSelect) {
      onChannelSelect(channel)
    } else {
      window.open(`https://youtube.com/channel/${channel.channelId}`, '_blank')
    }
  }, [onChannelSelect])

  const handleRefresh = useCallback(async () => {
    await fetchChannels()
  }, [fetchChannels])

  // Load channels on mount
  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading channels...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Users className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Channels</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Channels
                <Badge variant="secondary">{favoriteChannels.length}</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="flex gap-2 p-4 bg-muted/50 rounded-lg">
                <div className="flex gap-1">
                  {(['scroll', 'grid', 'list'] as const).map(mode => (
                    <Button
                      key={mode}
                      variant={viewMode === mode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode(mode)}
                    >
                      {mode === 'scroll' && 'Scroll'}
                      {mode === 'grid' && 'Grid'}
                      {mode === 'list' && 'List'}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      {favoriteChannels.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Channels Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start adding channels to your favorites to see them here.
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Channel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'scroll' && (
            <ScrollingChannelBar 
              channels={filteredChannels}
              className="w-full"
            />
          )}

          {viewMode === 'grid' && (
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {filteredChannels.map((channel) => (
                    <div
                      key={channel.id}
                      className="flex flex-col items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => handleChannelClick(channel)}
                    >
                      <div className="relative">
                        <img
                          src={channel.thumbnail}
                          alt={channel.name}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-background group-hover:ring-primary/50 transition-all"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=3b82f6&color=ffffff&size=64`
                          }}
                        />
                        
                        {/* Blacklist/Whitelist Buttons - Always Visible */}
                        <div className="absolute top-1 right-1 flex gap-1 transition-all duration-300 opacity-100 scale-100">
                          {onAddToWhitelist && !isWhitelisted(channel.channelId) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 min-h-[24px] min-w-[24px] p-0 touch-manipulation mobile-touch-feedback bg-green-500/90 hover:bg-green-600 text-white shadow-lg border border-green-400/30 transition-all duration-300 hover:scale-110"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToWhitelist(channel)
                              }}
                              title="Add to Whitelist"
                            >
                              <Shield className="w-3 h-3" />
                            </Button>
                          )}
                          {onAddToBlacklist && !isBlacklisted(channel.channelId) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 min-h-[24px] min-w-[24px] p-0 touch-manipulation mobile-touch-feedback bg-red-500/90 hover:bg-red-600 text-white shadow-lg border border-red-400/30 transition-all duration-300 hover:scale-110"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToBlacklist(channel)
                              }}
                              title="Add to Blacklist"
                            >
                              <ShieldOff className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-center min-w-0">
                        <p className="text-sm font-medium truncate">{channel.name}</p>
                        {channel.subscriberCount && (
                          <p className="text-xs text-muted-foreground">{channel.subscriberCount}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === 'list' && (
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2 p-4">
                    {filteredChannels.map((channel) => (
                      <div
                        key={channel.id}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                      >
                        <img
                          src={channel.thumbnail}
                          alt={channel.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-background group-hover:ring-primary/50 transition-all"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=3b82f6&color=ffffff&size=48`
                          }}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{channel.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {channel.subscriberCount && (
                              <span>{channel.subscriberCount} subscribers</span>
                            )}
                            {channel.videoCount && (
                              <span>{channel.videoCount} videos</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Blacklist/Whitelist Buttons - Always Visible on Mobile */}
                        <div className="flex items-center gap-2 opacity-100 transition-opacity">
                          {onAddToWhitelist && !isWhitelisted(channel.channelId) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 min-h-[24px] min-w-[24px] p-0 touch-manipulation mobile-touch-feedback bg-green-500/90 hover:bg-green-600 text-white shadow-lg border border-green-400/30 transition-all duration-300 hover:scale-110"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToWhitelist(channel)
                              }}
                              title="Add to Whitelist"
                            >
                              <Shield className="w-3 h-3" />
                            </Button>
                          )}
                          {onAddToBlacklist && !isBlacklisted(channel.channelId) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 min-h-[24px] min-w-[24px] p-0 touch-manipulation mobile-touch-feedback bg-red-500/90 hover:bg-red-600 text-white shadow-lg border border-red-400/30 transition-all duration-300 hover:scale-110"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToBlacklist(channel)
                              }}
                              title="Add to Blacklist"
                            >
                              <ShieldOff className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleChannelClick(channel)
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`https://youtube.com/channel/${channel.channelId}/videos`, '_blank')
                            }}
                          >
                            <Video className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeChannel(channel.id)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}