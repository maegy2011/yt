'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  Settings, 
  Loader2, 
  Trash2, 
  Database,
  Shield,
  Sliders,
  Eye,
  EyeOff,
  Palette,
  Volume2,
  Play,
  Search,
  Globe,
  Download,
  Smartphone,
  Monitor,
  Zap,
  Lock,
  Unlock,
  RefreshCw,
  Info,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Moon,
  Sun,
  MonitorIcon,
  Tablet,
  SmartphoneIcon,
  HardDrive,
  Cloud,
  CloudOff,
  Clock,
  History,
  FileText,
  Heart,
  Bell,
  User,
  Key,
  Fingerprint,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Bug,
  Star,
  MessageSquare,
  Github,
  Mail,
  BarChart3
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
  language: string
  autoPlay: boolean
  defaultVolume: number
  defaultQuality: string
  subtitlesEnabled: boolean
  notificationsEnabled: boolean
  compactMode: boolean
  showThumbnails: boolean
  dataSaver: boolean
  autoDownload: boolean
  searchHistory: boolean
  watchHistory: boolean
  analyticsEnabled: boolean
  crashReports: boolean
  cacheSize: number
  bufferSize: number
  preloadVideos: boolean
  backgroundPlay: boolean
  miniPlayer: boolean
  gestureControls: boolean
  doubleTapToSeek: boolean
  swipeControls: boolean
  autoplayRelated: boolean
  showRelatedVideos: boolean
  showComments: boolean
  showVideoStats: boolean
  rememberPosition: boolean
  loopVideos: boolean
  playbackSpeed: number
  skipIntro: boolean
  skipOutro: boolean
  skipAds: boolean
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
    language: 'en',
    autoPlay: true,
    defaultVolume: 70,
    defaultQuality: 'auto',
    subtitlesEnabled: false,
    notificationsEnabled: true,
    compactMode: false,
    showThumbnails: true,
    dataSaver: false,
    autoDownload: false,
    searchHistory: true,
    watchHistory: true,
    analyticsEnabled: false,
    crashReports: true,
    cacheSize: 500,
    bufferSize: 10,
    preloadVideos: true,
    backgroundPlay: true,
    miniPlayer: true,
    gestureControls: true,
    doubleTapToSeek: true,
    swipeControls: true,
    autoplayRelated: false,
    showRelatedVideos: true,
    showComments: true,
    showVideoStats: true,
    rememberPosition: true,
    loopVideos: false,
    playbackSpeed: 1.0,
    skipIntro: false,
    skipOutro: false,
    skipAds: false,
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
        language: 'en',
        autoPlay: true,
        defaultVolume: 70,
        defaultQuality: 'auto',
        subtitlesEnabled: false,
        notificationsEnabled: true,
        compactMode: false,
        showThumbnails: true,
        dataSaver: false,
        autoDownload: false,
        searchHistory: true,
        watchHistory: true,
        analyticsEnabled: false,
        crashReports: true,
        cacheSize: 500,
        bufferSize: 10,
        preloadVideos: true,
        backgroundPlay: true,
        miniPlayer: true,
        gestureControls: true,
        doubleTapToSeek: true,
        swipeControls: true,
        autoplayRelated: false,
        showRelatedVideos: true,
        showComments: true,
        showVideoStats: true,
        rememberPosition: true,
        loopVideos: false,
        playbackSpeed: 1.0,
        skipIntro: false,
        skipOutro: false,
        skipAds: false,
        blacklistWhitelistVisibility: 'always'
      }
      setAppSettings(defaultSettings)
      toast({
        title: "Settings Reset",
        description: "All settings have been reset to default values.",
      })
    }
  }

  const getStorageUsage = () => {
    const total = favoriteChannels.length + favoriteVideos.length
    const maxStorage = 1000 // Assumed max items
    return (total / maxStorage) * 100
  }

  const getCacheUsage = () => {
    return (appSettings.cacheSize / 1000) * 100
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
              <TabsTrigger value="data" className="flex items-center gap-2 px-3 py-2">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Data</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2 px-3 py-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Advanced</span>
              </TabsTrigger>
            </TabsList>
          </ScrollArea>
        </div>

        <ScrollArea className="flex-1">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-6 mt-0">
              <div className="grid gap-6">
                {/* Language & Region */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Language & Region
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select value={appSettings.language} onValueChange={(value: string) => updateSetting('language', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                            <SelectItem value="ja">日本語</SelectItem>
                            <SelectItem value="ko">한국어</SelectItem>
                            <SelectItem value="zh">中文</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="region">Content Region</Label>
                        <Select defaultValue="US">
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                            <SelectItem value="IN">India</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications for new videos and updates
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.notificationsEnabled}
                        onCheckedChange={(checked) => updateSetting('notificationsEnabled', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

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

                {/* Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Analytics & Reporting
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Usage Analytics</Label>
                        <p className="text-sm text-muted-foreground">
                          Help improve MyTube by sharing usage data
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.analyticsEnabled}
                        onCheckedChange={(checked) => updateSetting('analyticsEnabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Crash Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically send crash reports to help fix issues
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.crashReports}
                        onCheckedChange={(checked) => updateSetting('crashReports', checked)}
                      />
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
                {/* Video Quality */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Video Quality
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Default Quality</Label>
                      <Select value={appSettings.defaultQuality} onValueChange={(value: string) => updateSetting('defaultQuality', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto</SelectItem>
                          <SelectItem value="1080p">1080p HD</SelectItem>
                          <SelectItem value="720p">720p HD</SelectItem>
                          <SelectItem value="480p">480p</SelectItem>
                          <SelectItem value="360p">360p</SelectItem>
                          <SelectItem value="240p">240p</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Default Volume: {appSettings.defaultVolume}%</Label>
                      <Slider
                        value={[appSettings.defaultVolume]}
                        onValueChange={([value]) => updateSetting('defaultVolume', value)}
                        max={100}
                        step={5}
                        className="w-full"
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

                {/* Playback Features */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
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
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Background Play</Label>
                        <p className="text-sm text-muted-foreground">
                          Continue playing audio when app is in background
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.backgroundPlay}
                        onCheckedChange={(checked) => updateSetting('backgroundPlay', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Mini Player</Label>
                        <p className="text-sm text-muted-foreground">
                          Show mini player for background playback
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.miniPlayer}
                        onCheckedChange={(checked) => updateSetting('miniPlayer', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Subtitles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Subtitles & Captions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Subtitles</Label>
                        <p className="text-sm text-muted-foreground">
                          Show subtitles by default when available
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.subtitlesEnabled}
                        onCheckedChange={(checked) => updateSetting('subtitlesEnabled', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data" className="space-y-6 mt-0">
              <div className="grid gap-6">
                {/* Storage Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="w-5 h-5" />
                      Storage Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Storage Used</span>
                        <span className="text-sm text-muted-foreground">
                          {favoriteChannels.length + favoriteVideos.length} items
                        </span>
                      </div>
                      <Progress value={getStorageUsage()} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {getStorageUsage().toFixed(1)}% of storage used
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold text-primary">{favoriteChannels.length}</div>
                        <div className="text-xs text-muted-foreground">Channels</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold text-primary">{favoriteVideos.length}</div>
                        <div className="text-xs text-muted-foreground">Videos</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cache Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Cache Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Cache Size: {appSettings.cacheSize}MB</Label>
                      <Slider
                        value={[appSettings.cacheSize]}
                        onValueChange={([value]) => updateSetting('cacheSize', value)}
                        min={100}
                        max={1000}
                        step={50}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Buffer Size: {appSettings.bufferSize}MB</Label>
                      <Slider
                        value={[appSettings.bufferSize]}
                        onValueChange={([value]) => updateSetting('bufferSize', value)}
                        min={5}
                        max={50}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Data Saver Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Reduce data usage by lowering quality
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.dataSaver}
                        onCheckedChange={(checked) => updateSetting('dataSaver', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Preload Videos</Label>
                        <p className="text-sm text-muted-foreground">
                          Preload next video for smoother playback
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.preloadVideos}
                        onCheckedChange={(checked) => updateSetting('preloadVideos', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Data Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Data Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dataStatistics && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(dataStatistics).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <span className="text-sm font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="font-mono text-sm">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-6 mt-0">
              <div className="grid gap-6">
                {/* Experimental Features */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Experimental Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Gesture Controls</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable touch gestures for video control
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.gestureControls}
                        onCheckedChange={(checked) => updateSetting('gestureControls', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Double Tap to Seek</Label>
                        <p className="text-sm text-muted-foreground">
                          Double tap left/right to seek backward/forward
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.doubleTapToSeek}
                        onCheckedChange={(checked) => updateSetting('doubleTapToSeek', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Swipe Controls</Label>
                        <p className="text-sm text-muted-foreground">
                          Swipe to adjust volume and brightness
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.swipeControls}
                        onCheckedChange={(checked) => updateSetting('swipeControls', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Video Enhancements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Video Enhancements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Skip Intros</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically skip video intros when available
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.skipIntro}
                        onCheckedChange={(checked) => updateSetting('skipIntro', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Skip Outros</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically skip video outros when available
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.skipOutro}
                        onCheckedChange={(checked) => updateSetting('skipOutro', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Skip Ads</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically skip sponsored segments
                        </p>
                      </div>
                      <Switch
                        checked={appSettings.skipAds}
                        onCheckedChange={(checked) => updateSetting('skipAds', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-5 h-5" />
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        These actions are irreversible and will permanently delete your data.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={handleResetSettings}
                        className="w-full justify-start"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset All Settings
                      </Button>
                      
                      <Button
                        variant="destructive"
                        onClick={handleClearAllData}
                        disabled={loading || (
                          favoriteChannels.length === 0 && 
                          (favoritesEnabled ? favoriteVideos.length : 0) === 0
                        )}
                        className="w-full justify-start"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Clearing Data...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear All Data
                          </>
                        )}
                      </Button>
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