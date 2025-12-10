'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Loader2, 
  Trash2, 
  Database,
  Shield,
  Sliders,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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

export function SettingsContainer({
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

  // Fetch data statistics when component mounts
  useEffect(() => {
    fetchDataStatistics()
  }, [fetchDataStatistics])

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

  return (
    <div className="h-full bg-background">
      {/* Mobile-First Header */}
      <div className="bg-card/95 backdrop-blur-lg border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Configure your app preferences and privacy settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 space-y-6">
          
          {/* General Settings */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold">General Settings</h2>
            </div>

            {/* Auto Load More Setting */}
            <Card>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Auto Load More</label>
                    <p className="text-xs text-muted-foreground">
                      Automatically load more videos when scrolling to the bottom
                    </p>
                  </div>
                  <Switch
                    checked={autoLoadMore}
                    onCheckedChange={handleAutoLoadMoreChange}
                    disabled={loading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Favorites Module Settings */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Database className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold">Favorites Module</h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Enable/Disable Favorites */}
              <Card>
                <CardContent className="pt-3 sm:pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Enable Favorites</label>
                      <p className="text-xs text-muted-foreground">
                        Turn the favorites module on or off
                      </p>
                    </div>
                    <Switch
                      checked={favoritesEnabled}
                      onCheckedChange={handleFavoritesEnabledChange}
                      disabled={loading}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pause/Resume Favorites */}
              {favoritesEnabled && (
                <Card>
                  <CardContent className="pt-3 sm:pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium">Pause Favorites</label>
                        <p className="text-xs text-muted-foreground">
                          Temporarily pause adding/removing favorites
                        </p>
                      </div>
                      <Switch
                        checked={favoritesPaused}
                        onCheckedChange={handleFavoritesPausedChange}
                        disabled={loading}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Data Statistics */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Database className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold">Data Statistics</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm sm:text-base">Storage Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-primary">{favoriteChannels.length}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Favorite Channels</div>
                  </div>
                  {favoritesEnabled && (
                    <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-primary">{favoriteVideos.length}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Favorite Videos</div>
                    </div>
                  )}
                </div>
                
                <div className="pt-3 sm:pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base font-medium">Total Items</span>
                    <span className="text-lg sm:text-xl font-bold text-primary">
                      {favoriteChannels.length + (favoritesEnabled ? favoriteVideos.length : 0)}
                    </span>
                  </div>
                </div>

                {dataStatistics && (
                  <div className="pt-3 sm:pt-4 border-t space-y-2">
                    <h4 className="text-sm font-medium">Detailed Statistics</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {Object.entries(dataStatistics).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Privacy Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold">Privacy & Data Management</h2>
            </div>

            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Warning:</strong> This will permanently delete all your data including 
                    favorite channels, favorite videos, watched history, notes, and all local settings. 
                    This action cannot be undone.
                  </AlertDescription>
                </Alert>

                <Button
                  variant="destructive"
                  onClick={handleClearAllData}
                  disabled={loading || (
                    favoriteChannels.length === 0 && 
                    (favoritesEnabled ? favoriteVideos.length : 0) === 0
                  )}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Clearing Data...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Clear All Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* About Section */}
          <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold">About</h2>
            </div>

            <Card>
              <CardContent className="pt-3 sm:pt-6">
                <div className="space-y-3 sm:space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Application</span>
                    <span className="font-medium">MyTube</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Storage</span>
                    <span className="font-medium">Local (Browser)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Privacy</span>
                    <span className="font-medium">100% Local</span>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t text-xs text-muted-foreground">
                  Your data never leaves your device. All favorites, settings, and history are stored locally in your browser.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}