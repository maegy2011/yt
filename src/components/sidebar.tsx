'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Home, 
  TrendingUp, 
  Music, 
  Gamepad2, 
  Newspaper, 
  Trophy, 
  Film, 
  BookOpen, 
  Cpu, 
  Clock, 
  Bookmark, 
  Download, 
  List, 
  Settings,
  User,
  Heart,
  History as HistoryIcon
} from 'lucide-react'

interface SidebarProps {
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  currentView?: 'videos' | 'history' | 'bookmarks' | 'downloads' | 'playlists'
  setCurrentView?: (view: 'videos' | 'history' | 'bookmarks' | 'downloads' | 'playlists') => void
}

const categories = [
  { name: 'All', icon: Home },
  { name: 'Trending', icon: TrendingUp },
  { name: 'Music', icon: Music },
  { name: 'Gaming', icon: Gamepad2 },
  { name: 'News', icon: Newspaper },
  { name: 'Sports', icon: Trophy },
  { name: 'Entertainment', icon: Film },
  { name: 'Education', icon: BookOpen },
  { name: 'Tech', icon: Cpu }
]

const libraryItems = [
  { name: 'History', icon: HistoryIcon, view: 'history' },
  { name: 'Bookmarks', icon: Bookmark, view: 'bookmarks' },
  { name: 'Downloads', icon: Download, view: 'downloads' },
  { name: 'Playlists', icon: List, view: 'playlists' }
]

const subscriptionItems = [
  { name: 'Subscriptions', icon: User },
  { name: 'Liked Videos', icon: Heart }
]

export function Sidebar({ 
  selectedCategory, 
  setSelectedCategory, 
  isSidebarOpen, 
  setIsSidebarOpen,
  currentView = 'videos',
  setCurrentView = () => {}
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {/* Categories Section */}
          <div className="space-y-2">
            <h2 className="px-4 text-lg font-semibold tracking-tight">
              Categories
            </h2>
            <div className="space-y-1">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.name}
                    variant={selectedCategory === category.name && currentView === 'videos' ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      selectedCategory === category.name && currentView === 'videos' && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => {
                      setSelectedCategory(category.name)
                      setCurrentView('videos')
                      setIsSidebarOpen(false)
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {category.name}
                  </Button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Library Section */}
          <div className="space-y-2">
            <h2 className="px-4 text-lg font-semibold tracking-tight">
              Library
            </h2>
            <div className="space-y-1">
              {libraryItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.name}
                    variant={currentView === item.view ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      currentView === item.view && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => {
                      setCurrentView(item.view as any)
                      setIsSidebarOpen(false)
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Subscriptions Section */}
          <div className="space-y-2">
            <h2 className="px-4 text-lg font-semibold tracking-tight">
              Subscriptions
            </h2>
            <div className="space-y-1">
              {subscriptionItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Settings */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setIsSidebarOpen(false)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}