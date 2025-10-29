'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Search, 
  Play, 
  Eye, 
  Heart, 
  FileText, 
  Users,
  Settings,
  TrendingUp,
  Radio
} from 'lucide-react'
import type { Tab } from '@/app/page'

interface BottomNavigationProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  watchedVideosCount: number
  favoriteVideosCount: number
  favoriteChannelsCount: number
  videoNotesCount: number
}

const bottomNavItems = [
  { id: 'home' as Tab, label: 'Home', icon: Home },
  { id: 'search' as Tab, label: 'Search', icon: Search },
  { id: 'trending' as Tab, label: 'Trending', icon: TrendingUp },
  { id: 'favorites' as Tab, label: 'Favorites', icon: Heart },
  { id: 'channels' as Tab, label: 'Channels', icon: Users },
]

export function BottomNavigation({ 
  activeTab, 
  onTabChange, 
  watchedVideosCount,
  favoriteVideosCount,
  favoriteChannelsCount,
  videoNotesCount
}: BottomNavigationProps) {
  const getCounters = () => ({
    favorites: favoriteVideosCount,
    channels: favoriteChannelsCount,
  })

  const counters = getCounters()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t md:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          const showCounter = counters[item.id as keyof typeof counters] > 0

          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              className="flex-col h-12 px-2 relative"
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs mt-1">{item.label}</span>
              {showCounter && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {counters[item.id as keyof typeof counters]}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}