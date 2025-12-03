'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Shield, Eye, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BlacklistedItem {
  id: string
  itemId: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
  addedAt: string
  updatedAt?: string
}

interface WhitelistedItem {
  id: string
  itemId: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
  addedAt: string
  updatedAt?: string
}

export function BlacklistWhitelistStats() {
  const [blacklistedItems, setBlacklistedItems] = useState<BlacklistedItem[]>([])
  const [whitelistedItems, setWhitelistedItems] = useState<WhitelistedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const [blacklistedResponse, whitelistedResponse] = await Promise.all([
        fetch('/api/blacklist'),
        fetch('/api/whitelist')
      ])
      
      const [blacklisted, whitelisted] = await Promise.all([
        blacklistedResponse.json(),
        whitelistedResponse.json()
      ])
      
      setBlacklistedItems(blacklisted.items || [])
      setWhitelistedItems(whitelisted.items || [])
    } catch (error) {
      console.error('Error fetching blacklist/whitelist data:', error)
      setBlacklistedItems([])
      setWhitelistedItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading statistics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Refresh Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Overview of your blacklisted and whitelisted content
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blacklisted Items Statistics */}
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-destructive" />
            <h4 className="font-semibold">Blacklisted Items</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total:</span>
              <Badge variant="destructive">{blacklistedItems.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Videos:</span>
              <Badge variant="outline">
                {blacklistedItems.filter(item => item.type === 'video').length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Playlists:</span>
              <Badge variant="outline">
                {blacklistedItems.filter(item => item.type === 'playlist').length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Channels:</span>
              <Badge variant="outline">
                {blacklistedItems.filter(item => item.type === 'channel').length}
              </Badge>
            </div>
          </div>
        </div>

        {/* Whitelisted Items Statistics */}
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">Whitelisted Items</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total:</span>
              <Badge variant="default">{whitelistedItems.length}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Videos:</span>
              <Badge variant="outline">
                {whitelistedItems.filter(item => item.type === 'video').length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Playlists:</span>
              <Badge variant="outline">
                {whitelistedItems.filter(item => item.type === 'playlist').length}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Channels:</span>
              <Badge variant="outline">
                {whitelistedItems.filter(item => item.type === 'channel').length}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Total Filtered Items:</span>
          <Badge variant="secondary">
            {blacklistedItems.length + whitelistedItems.length}
          </Badge>
        </div>
      </div>
    </div>
  )
}