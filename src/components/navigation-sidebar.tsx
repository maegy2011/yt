'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Home, 
  Search, 
  Play, 
  Clock, 
  Heart, 
  FileText, 
  User, 
  Eye,
  Settings,
  Users,
  TrendingUp,
  BarChart3,
  Zap,
  Radio,
  Calendar,
  Star,
  Filter
} from 'lucide-react'
import type { Tab } from '@/app/page'

interface NavigationSidebarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  watchedVideosCount: number
  favoriteVideosCount: number
  favoriteChannelsCount: number
  videoNotesCount: number
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const navigationItems = [
  { id: 'home' as Tab, label: 'Home', icon: Home, color: 'text-blue-600' },
  { id: 'search' as Tab, label: 'Search', icon: Search, color: 'text-green-600' },
  { id: 'trending' as Tab, label: 'Trending', icon: TrendingUp, color: 'text-red-600' },
  { id: 'watched' as Tab, label: 'Watched', icon: Eye, color: 'text-purple-600' },
  { id: 'favorites' as Tab, label: 'Favorites', icon: Heart, color: 'text-pink-600' },
  { id: 'channels' as Tab, label: 'Channels', icon: Users, color: 'text-indigo-600' },
  { id: 'notes' as Tab, label: 'Notes', icon: FileText, color: 'text-yellow-600' },
  { id: 'player' as Tab, label: 'Player', icon: Play, color: 'text-orange-600' },
  { id: 'explore' as Tab, label: 'Explore', icon: Radio, color: 'text-teal-600' },
  { id: 'config' as Tab, label: 'Settings', icon: Settings, color: 'text-gray-600' },
]

export function NavigationSidebar({ 
  activeTab, 
  onTabChange, 
  watchedVideosCount,
  favoriteVideosCount,
  favoriteChannelsCount,
  videoNotesCount,
  isCollapsed = false,
  onToggleCollapse
}: NavigationSidebarProps) {
  const getCounters = () => ({
    watched: watchedVideosCount,
    favorites: favoriteVideosCount,
    channels: favoriteChannelsCount,
    notes: videoNotesCount,
  })

  const counters = getCounters()

  return (
    <div className={`bg-card border-r transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-primary">MyTube</h2>
              <p className="text-xs text-muted-foreground">Navigation</p>
            </div>
          )}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0"
            >
              <Filter className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          )}
        </div>

        {/* Navigation Items */}
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const showCounter = counters[item.id as keyof typeof counters] > 0

              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`w-full justify-start ${isCollapsed ? 'px-2' : 'px-3'} h-10`}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-current' : item.color}`} />
                  {!isCollapsed && (
                    <>
                      <span className="ml-3 flex-1 text-left">{item.label}</span>
                      {showCounter && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {counters[item.id as keyof typeof counters]}
                        </Badge>
                      )}
                    </>
                  )}
                </Button>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Quick Stats */}
        {!isCollapsed && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-bold text-blue-600">{favoriteChannelsCount}</div>
                <div className="text-muted-foreground">Channels</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-bold text-pink-600">{favoriteVideosCount}</div>
                <div className="text-muted-foreground">Favorites</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-bold text-purple-600">{watchedVideosCount}</div>
                <div className="text-muted-foreground">Watched</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-bold text-yellow-600">{videoNotesCount}</div>
                <div className="text-muted-foreground">Notes</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}