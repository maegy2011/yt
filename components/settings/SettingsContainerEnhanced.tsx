'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Settings, 
  Loader2, 
  Trash2, 
  Database,
  Shield,
  Sliders,
  Palette,
  Play,
  Eye,
  EyeOff,
  Moon,
  Sun,
  MonitorIcon,
  Monitor,
  HardDrive,
  Clock,
  History,
  FileText,
  Heart,
  Bell,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { IncognitoToggleEnhanced } from '@/components/incognito-toggle-enhanced'
import { cn } from '@/lib/utils'

interface SettingsContainerProps {
  autoLoadMore: boolean
  setAutoLoadMore: (value: boolean) => void
  favoritesEnabled: boolean
  setFavoritesEnabled: (value: boolean) => void
  favoritesPaused: boolean
  setFavoritesPaused: (value: boolean) => void
  favoriteChannels: any[]
  favoriteVideos: any[]
  activeTab: string
  setActiveTab: (tab: string) => void
  loading: boolean
  onClearAllData: () => void
  dataStatistics: any
  fetchDataStatistics: () => void
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  autoPlay: boolean
  compactMode: boolean
  showThumbnails: boolean
  showRelatedVideos: boolean
  showComments: boolean
  showVideoStats: boolean
  rememberPosition: boolean
  loopVideos: boolean
  playbackSpeed: number
  searchHistory: boolean
  watchHistory: boolean
  blacklistWhitelistVisibility: 'always' | 'hover' | 'hidden'
}

export function SettingsContainerEnhanced({
  autoLoadMore,
  setAutoLoadMore,
  favoritesEnabled,
  setFavoritesEnabled,
  favoritesPaused,
  setFavoritesPaused,
  favoriteChannels,
  favoriteVideos,
  activeTab,
  setActiveTab,
  loading,
  onClearAllData,
  dataStatistics,
  fetchDataStatistics
}: SettingsContainerProps) {
  const { toast } = useToast()
  const [activeSettingsTab, setActiveSettingsTab] = useState('general')
  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'system',
    autoPlay: true,
    compactMode: false,
    showThumbnails: true,
    showRelatedVideos: true,
    showComments: true,
    showVideoStats: true,
    rememberPosition: true,
    loopVideos: false,
    playbackSpeed: 1.0,
    searchHistory: true,
    watchHistory: true,
    blacklistWhitelistVisibility: 'always'
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('mytube-app-settings')
    if (savedSettings) {
      try {
        setAppSettings(JSON.parse(savedSettings))
      } catch (error) {
        // Failed to load settings
      }
    }
    fetchDataStatistics()
  }, [fetchDataStatistics])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mytube-app-settings', JSON.stringify(appSettings))
  }, [appSettings])

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setAppSettings(prev => ({ ...prev, [key]: value }))
    toast({
      title: "Setting Updated",
      description: `${key} has been updated.`,
      duration: 2000,
    })
  }

  const handleFavoritesEnabledChange = (checked: boolean) => {
    setFavoritesEnabled(checked)
    localStorage.setItem('mytube-favorites-enabled', checked.toString())
    if (!checked && activeTab === 'favorites') {
      setActiveTab('home')
    }
    toast({
      title: checked ? "Favorites Enabled" : "Favorites Disabled",
      description: checked ? "The favorites module has been enabled." : "The favorites module has been disabled.",
    })
  }

  const handleFavoritesPausedChange = (checked: boolean) => {
    setFavoritesPaused(checked)
    localStorage.setItem('mytube-favorites-paused', checked.toString())
    toast({
      title: checked ? "Favorites Paused" : "Favorites Resumed",
      description: checked ? "Adding/removing favorites has been paused." : "Adding/removing favorites has been resumed.",
    })
  }

  const handleAutoLoadMoreChange = (checked: boolean) => {
    setAutoLoadMore(checked)
    toast({
      title: checked ? "Auto Load Enabled" : "Auto Load Disabled",
      description: checked ? "Videos will automatically load when scrolling." : "Auto-loading has been disabled.",
    })
  }

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      onClearAllData()
    }
  }

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      const defaultSettings: AppSettings = {
        theme: 'system',
        autoPlay: true,
        compactMode: false,
        showThumbnails: true,
        showRelatedVideos: true,
        showComments: true,
        showVideoStats: true,
        rememberPosition: true,
        loopVideos: false,
        playbackSpeed: 1.0,
        searchHistory: true,
        watchHistory: true,
        blacklistWhitelistVisibility: 'always'
      }
      setAppSettings(defaultSettings)
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to default values.",
      })
    }
  }

  

  return (
    <div className="h-full bg-background">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/50 backdrop-blur-lg px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Customize your MyTube experience</p>
            </div>
            <Badge variant="outline" className="hidden sm:flex">
              <CheckCircle className="w-3 h-3 mr-1" />
              Enhanced
            </Badge>
          </div>
        </div>
      </div>

      {/* Enhanced Settings Tabs */}
      <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="flex-1">
        <div className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <ScrollArea className="w-full">
            <TabsList className="h-auto p-1 bg-transparent w-full justify-start gap-1">
              <TabsTrigger value="general" className="flex items-center gap-2 px-3 py-2">
                <Sliders className="w-4 h-4" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2 px-3 py-2">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2 px-3 py-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="playback" className="flex items-center gap-2 px-3 py-2">
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline">Playback</span>
              </TabsTrigger>
            </TabsList>
          </ScrollArea>
        </div>

        <ScrollArea className="flex-1">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-6 mt-0">
              <div className="grid gap-6">
                {/* Content Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Content Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-play Videos</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically play videos when selected
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.autoPlay}
                        onCheckedChange={(checked) => updateSetting('autoPlay', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Related Videos</Label>
                        <p className="text-sm text-muted-foreground">
                          Display related videos after playback
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.showRelatedVideos}
                        onCheckedChange={(checked) => updateSetting('showRelatedVideos', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Comments</Label>
                        <p className="text-sm text-muted-foreground">
                          Display video comments section
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.showComments}
                        onCheckedChange={(checked) => updateSetting('showComments', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Favorites Module */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Favorites Module
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Favorites</Label>
                        <p className="text-sm text-muted-foreground">
                          Turn favorites module on or off
                        </p>
                      </div>
                      <Switch
                        checked={favoritesEnabled}
                        onCheckedChange={handleFavoritesEnabledChange}
                        disabled={loading}
                      />
                    </div>
                    {favoritesEnabled && (
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Pause Favorites</Label>
                          <p className="text-sm text-muted-foreground">
                            Temporarily pause adding/removing favorites
                          </p>
                        </div>
                        <Switch
                          checked={favoritesPaused}
                          onCheckedChange={handleFavoritesPausedChange}
                          disabled={loading}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6 mt-0">
              <div className="grid gap-6">
                {/* Theme */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Theme
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'system', label: 'System', icon: MonitorIcon }
                      ].map(({ value, label, icon: Icon }) => (
                        <Button
                          key={value}
                          variant={appSettings.theme === value ? 'default' : 'outline'}
                          className="flex items-center gap-2 h-auto p-4"
                          onClick={() => updateSetting('theme', value as any)}
                        >
                          <Icon className="w-5 h-5" />
                          <div className="text-left">
                            <div className="font-medium">{label}</div>
                            <div className="text-xs text-muted-foreground">
                              {value === 'system' ? 'Follows system preference' : `${label} theme`}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Display */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5" />
                      Display
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Compact Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Use more compact layout for better space utilization
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.compactMode}
                        onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Thumbnails</Label>
                        <p className="text-sm text-muted-foreground">
                          Display video thumbnails in lists
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.showThumbnails}
                        onCheckedChange={(checked) => updateSetting('showThumbnails', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Video Statistics</Label>
                        <p className="text-sm text-muted-foreground">
                          Display view counts, likes, and other stats
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.showVideoStats}
                        onCheckedChange={(checked) => updateSetting('showVideoStats', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6 mt-0">
              <div className="grid gap-6">
                {/* Privacy Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Privacy Controls
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Search History</Label>
                        <p className="text-sm text-muted-foreground">
                          Save your search queries for future reference
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.searchHistory}
                        onCheckedChange={(checked) => updateSetting('searchHistory', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Watch History</Label>
                        <p className="text-sm text-muted-foreground">
                          Keep track of videos you've watched
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.watchHistory}
                        onCheckedChange={(checked) => updateSetting('watchHistory', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Blacklist/Whitelist Buttons</Label>
                        <p className="text-sm text-muted-foreground">
                          Control when blacklist and whitelist buttons are visible
                        </p>
                      </div>
                      <Select value={appSettings.blacklistWhitelistVisibility} onValueChange={(value: 'always' | 'hover' | 'hidden') => updateSetting('blacklistWhitelistVisibility', value)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="always">Always Visible</SelectItem>
                          <SelectItem value="hover">On Hover</SelectItem>
                          <SelectItem value="hidden">Always Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Incognito Mode */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <EyeOff className="w-5 h-5" />
                      Incognito Mode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                          <Label>Private Browsing</Label>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Browse privately without saving your activity
                        </p>
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                            <span>Watch history not saved</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                            <span>Favorites disabled</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                            <span>Search history not saved</span>
                          </div>
                        </div>
                      </div>
                      <IncognitoToggleEnhanced />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Playback Tab */}
            <TabsContent value="playback" className="space-y-6 mt-0">
              <div className="grid gap-6">
                {/* Playback Features */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Playback Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Remember Position</Label>
                        <p className="text-sm text-muted-foreground">
                          Continue videos from where you left off
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.rememberPosition}
                        onCheckedChange={(checked) => updateSetting('rememberPosition', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Loop Videos</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically replay videos when they end
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.loopVideos}
                        onCheckedChange={(checked) => updateSetting('loopVideos', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Playback Speed: {appSettings.playbackSpeed}x</Label>
                      <Slider
                        value={[appSettings.playbackSpeed]}
                        onValueChange={([value]) => updateSetting('playbackSpeed', value)}
                        min={0.25}
                        max={2}
                        step={0.25}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  )
}