'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Settings, 
  Sliders, 
  Palette, 
  Shield, 
  Play, 
  Database, 
  Zap,
  ChevronRight,
  Star,
  Clock,
  Globe,
  Volume2,
  Wifi,
  HardDrive,
  Moon,
  Sun,
  Monitor,
  Bell,
  Eye,
  EyeOff,
  Download,
  RefreshCw
} from 'lucide-react'

interface SettingItem {
  id: string
  title: string
  description: string
  category: string
  icon: React.ComponentType<{ className?: string }>
  keywords: string[]
  action?: () => void
}

interface SettingsSearchProps {
  onSettingSelect?: (setting: SettingItem) => void
  className?: string
}

export function SettingsSearch({ onSettingSelect, className }: SettingsSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const allSettings: SettingItem[] = [
    // General Settings
    {
      id: 'language',
      title: 'Language',
      description: 'Change the app language and region settings',
      category: 'general',
      icon: Globe,
      keywords: ['language', 'region', 'locale', 'translation']
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage push notifications and alerts',
      category: 'general',
      icon: Bell,
      keywords: ['notification', 'alert', 'push', 'notify']
    },
    {
      id: 'autoplay',
      title: 'Auto-play Videos',
      description: 'Automatically play videos when selected',
      category: 'general',
      icon: Play,
      keywords: ['autoplay', 'auto', 'play', 'video']
    },

    // Appearance Settings
    {
      id: 'theme',
      title: 'Theme',
      description: 'Choose between light, dark, or system theme',
      category: 'appearance',
      icon: Palette,
      keywords: ['theme', 'dark', 'light', 'system', 'color']
    },
    {
      id: 'compact-mode',
      title: 'Compact Mode',
      description: 'Use more compact layout for better space utilization',
      category: 'appearance',
      icon: Monitor,
      keywords: ['compact', 'layout', 'space', 'dense']
    },
    {
      id: 'thumbnails',
      title: 'Show Thumbnails',
      description: 'Display video thumbnails in lists',
      category: 'appearance',
      icon: Eye,
      keywords: ['thumbnail', 'preview', 'image', 'visual']
    },

    // Privacy Settings
    {
      id: 'search-history',
      title: 'Search History',
      description: 'Save your search queries for future reference',
      category: 'privacy',
      icon: Search,
      keywords: ['search', 'history', 'query', 'save']
    },
    {
      id: 'watch-history',
      title: 'Watch History',
      description: 'Keep track of videos you\'ve watched',
      category: 'privacy',
      icon: Clock,
      keywords: ['watch', 'history', 'track', 'video']
    },

    // Playback Settings
    {
      id: 'video-quality',
      title: 'Video Quality',
      description: 'Set default video quality for playback',
      category: 'playback',
      icon: Monitor,
      keywords: ['quality', 'resolution', 'hd', '1080p', '720p']
    },
    {
      id: 'volume',
      title: 'Default Volume',
      description: 'Set the default volume level for videos',
      category: 'playback',
      icon: Volume2,
      keywords: ['volume', 'audio', 'sound', 'level']
    },
    {
      id: 'playback-speed',
      title: 'Playback Speed',
      description: 'Adjust the default playback speed',
      category: 'playback',
      icon: Zap,
      keywords: ['speed', 'playback', 'rate', 'fast', 'slow']
    },
    {
      id: 'background-play',
      title: 'Background Play',
      description: 'Continue playing audio when app is in background',
      category: 'playback',
      icon: Play,
      keywords: ['background', 'play', 'audio', 'picture']
    },

    // Data Settings
    {
      id: 'data-saver',
      title: 'Data Saver Mode',
      description: 'Reduce data usage by lowering quality',
      category: 'data',
      icon: Wifi,
      keywords: ['data', 'saver', 'usage', 'mobile', 'wifi']
    },
    {
      id: 'cache-size',
      title: 'Cache Size',
      description: 'Adjust the amount of storage used for cache',
      category: 'data',
      icon: HardDrive,
      keywords: ['cache', 'storage', 'size', 'memory']
    },
    {
      id: 'auto-download',
      title: 'Auto Download',
      description: 'Automatically download videos for offline viewing',
      category: 'data',
      icon: Download,
      keywords: ['download', 'offline', 'auto', 'save']
    },

    // Advanced Settings
    {
      id: 'gesture-controls',
      title: 'Gesture Controls',
      description: 'Enable touch gestures for video control',
      category: 'advanced',
      icon: Zap,
      keywords: ['gesture', 'touch', 'control', 'swipe']
    },
    {
      id: 'experimental',
      title: 'Experimental Features',
      description: 'Try out new and experimental features',
      category: 'advanced',
      icon: Star,
      keywords: ['experimental', 'beta', 'new', 'feature']
    }
  ]

  const categories = [
    { id: 'all', label: 'All Settings', icon: Settings },
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'playback', label: 'Playback', icon: Play },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'advanced', label: 'Advanced', icon: Zap }
  ]

  const filteredSettings = useMemo(() => {
    let filtered = allSettings

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(setting => setting.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(setting =>
        setting.title.toLowerCase().includes(query) ||
        setting.description.toLowerCase().includes(query) ||
        setting.keywords.some(keyword => keyword.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [searchQuery, selectedCategory])

  const handleSettingClick = (setting: SettingItem) => {
    if (onSettingSelect) {
      onSettingSelect(setting)
    }
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.icon : Settings
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const Icon = category.icon
          const isActive = selectedCategory === category.id
          const count = category.id === 'all' 
            ? allSettings.length 
            : allSettings.filter(s => s.category === category.id).length

          return (
            <Button
              key={category.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              <span>{category.label}</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {count}
              </Badge>
            </Button>
          )
        })}
      </div>

      {/* Search Results */}
      <div className="space-y-2">
        {filteredSettings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No settings found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse all settings
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSettings.map((setting) => {
            const Icon = setting.icon
            const CategoryIcon = getCategoryIcon(setting.category)

            return (
              <Card key={setting.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm mb-1">{setting.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {setting.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Search Stats */}
      {searchQuery && (
        <div className="text-xs text-muted-foreground text-center">
          Found {filteredSettings.length} setting{filteredSettings.length !== 1 ? 's' : ''} 
          {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.label}`}
        </div>
      )}
    </div>
  )
}