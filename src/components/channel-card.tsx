'use client'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Video, CheckCircle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { getChannelLogo } from '@/lib/rate-limiter'

interface Channel {
  id: string
  name: string
  description?: string
  thumbnail: any
  subscriberCount: number
  videoCount: number
  isVerified?: boolean
  logoUrl?: string
  hasCustomLogo?: boolean
}

interface ChannelCardProps {
  channel: Channel
  onAddToFavorites?: (channel: Channel) => void
}

export function ChannelCard({ channel, onAddToFavorites }: ChannelCardProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const [isRefreshingLogo, setIsRefreshingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(channel.logoUrl || null)
  const [hasCustomLogo, setHasCustomLogo] = useState(channel.hasCustomLogo || false)

  const formatSubscriberCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const getThumbnailUrl = (thumbnail: any): string => {
    // Use real logo if available, otherwise fall back to thumbnail
    if (logoUrl) return logoUrl
    if (thumbnail?.url) return thumbnail.url
    if (thumbnail) return thumbnail
    // Generate a default avatar with channel name
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=6366f1&color=fff&size=128`
  }

  const refreshChannelLogo = async () => {
    if (isRefreshingLogo) return
    
    setIsRefreshingLogo(true)
    try {
      const realLogoUrl = await getChannelLogo(channel.id)
      setLogoUrl(realLogoUrl)
      setHasCustomLogo(!realLogoUrl.includes('ui-avatars.com'))
      
      toast.success('Channel logo updated!', {
        description: `Fetched the latest logo for ${channel.name}`
      })
    } catch (error) {
      toast.error('Failed to refresh logo', {
        description: 'Could not fetch the latest channel logo'
      })
    } finally {
      setIsRefreshingLogo(false)
    }
  }

  const handleAddToFavorites = async () => {
    if (isAdded || isAdding) return

    setIsAdding(true)
    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: channel.id,
          name: channel.name,
          thumbnail: getThumbnailUrl(channel.thumbnail),
          subscriberCount: channel.subscriberCount,
          logoUrl: logoUrl,
          hasCustomLogo: hasCustomLogo
        })
      })

      if (response.ok) {
        setIsAdded(true)
        toast.success('Channel added to favorites!', {
          description: `${channel.name} has been added to your favorite channels.`
        })
        onAddToFavorites?.(channel)
      } else if (response.status === 409) {
        setIsAdded(true)
        toast.info('Already in favorites', {
          description: `${channel.name} is already in your favorite channels.`
        })
      } else {
        throw new Error('Failed to add channel')
      }
    } catch (error) {
      toast.error('Failed to add channel', {
        description: 'There was an error adding this channel to your favorites.'
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Channel Thumbnail */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
              <img
                src={getThumbnailUrl(channel.thumbnail)}
                alt={channel.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  // Fall back to generated avatar on error
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=6366f1&color=fff&size=128`
                }}
              />
            </div>
            
            {/* Logo refresh button for non-custom logos */}
            {!hasCustomLogo && !isRefreshingLogo && (
              <button
                onClick={refreshChannelLogo}
                className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-md hover:bg-muted transition-colors"
                title="Refresh channel logo"
              >
                <RefreshCw className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
            
            {/* Loading indicator for logo refresh */}
            {isRefreshingLogo && (
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {channel.isVerified && (
              <div className="absolute -top-1 -right-1 bg-background rounded-full p-1">
                <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
              </div>
            )}
          </div>

          {/* Channel Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {channel.name}
            </h3>
            
            {channel.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {channel.description}
              </p>
            )}

            {/* Channel Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{formatSubscriberCount(channel.subscriberCount)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Video className="w-4 h-4" />
                <span>{channel.videoCount.toLocaleString()}</span>
              </div>
            </div>
            
            {/* Logo status indicator */}
            {logoUrl && (
              <div className="mt-2">
                <Badge variant={hasCustomLogo ? "default" : "secondary"} className="text-xs">
                  {hasCustomLogo ? "Custom Logo" : "Generated Avatar"}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToFavorites}
          disabled={isAdding || isAdded}
          className="w-full"
          variant={isAdded ? "secondary" : "default"}
        >
          {isAdding ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Adding...
            </>
          ) : isAdded ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Added to Favorites
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add to Favorites
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}