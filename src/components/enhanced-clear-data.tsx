'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Trash2, 
  Settings, 
  Database, 
  Clock, 
  Bookmark, 
  FileText, 
  PlayCircle, 
  History,
  AlertTriangle,
  CheckCircle,
  Users,
  Search,
  BookOpen,
  Link
} from 'lucide-react'

interface DataStatistics {
  favoriteChannels: number
  favoriteVideos: number
  videoNotes: number
  watchedVideos: number
  notebooks: number
  playbackPositions: number
  noteLinks: number
  total: number
}

interface ClearDataOptions {
  favoriteChannels: boolean
  favoriteVideos: boolean
  videoNotes: boolean
  watchedVideos: boolean
  notebooks: boolean
  playbackPositions: boolean
  noteLinks: boolean
  localStorage: boolean
  searchCache: boolean
  userPreferences: boolean
}

interface EnhancedClearDataProps {
  statistics: DataStatistics | null
  onClearData: (options: ClearDataOptions) => Promise<void>
  onCancel: () => void
  loading: boolean
}

export function EnhancedClearData({ statistics, onClearData, onCancel, loading }: EnhancedClearDataProps) {
  const [options, setOptions] = useState<ClearDataOptions>({
    favoriteChannels: false,
    favoriteVideos: false,
    videoNotes: false,
    watchedVideos: false,
    notebooks: false,
    playbackPositions: false,
    noteLinks: false,
    localStorage: false,
    searchCache: false,
    userPreferences: false
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectAll, setSelectAll] = useState(false)

  // Calculate selected items count
  const selectedCount = Object.values(options).filter(Boolean).length
  const hasAnyData = statistics && statistics.total > 0

  // Handle select all toggle
  useEffect(() => {
    setOptions(prev => ({
      ...prev,
      favoriteChannels: selectAll,
      favoriteVideos: selectAll,
      videoNotes: selectAll,
      watchedVideos: selectAll,
      notebooks: selectAll,
      playbackPositions: selectAll,
      noteLinks: selectAll,
      localStorage: selectAll,
      searchCache: selectAll,
      userPreferences: selectAll
    }))
  }, [selectAll])

  // Auto-select all if no items selected and there's data
  useEffect(() => {
    if (selectedCount === 0 && hasAnyData) {
      setSelectAll(true)
    }
  }, [selectedCount, hasAnyData])

  const handleOptionChange = (key: keyof ClearDataOptions, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      [key]: checked
    }))
    setSelectAll(false) // Reset select all when manually changing options
  }

  const handleClearData = async () => {
    if (selectedCount === 0) {
      return
    }
    await onClearData(options)
  }

  const getDataIcon = (key: keyof ClearDataOptions) => {
    const iconMap = {
      favoriteChannels: Users,
      favoriteVideos: Bookmark,
      videoNotes: FileText,
      watchedVideos: History,
      notebooks: BookOpen,
      playbackPositions: PlayCircle,
      noteLinks: Link,
      localStorage: Database,
      searchCache: Search,
      userPreferences: Settings
    }
    return iconMap[key] || Database
  }

  const getDataLabel = (key: keyof ClearDataOptions) => {
    const labelMap = {
      favoriteChannels: 'Favorite Channels',
      favoriteVideos: 'Favorite Videos',
      videoNotes: 'Video Notes',
      watchedVideos: 'Watch History',
      notebooks: 'Notebooks',
      playbackPositions: 'Playback Positions',
      noteLinks: 'Note Links',
      localStorage: 'Local Storage Data',
      searchCache: 'Search Cache',
      userPreferences: 'User Preferences'
    }
    return labelMap[key] || key
  }

  const getDataCount = (key: keyof ClearDataOptions): number => {
    if (!statistics) return 0
    return statistics[key as keyof DataStatistics] || 0
  }

  const getStorageWarning = (key: keyof ClearDataOptions) => {
    const storageItems = ['localStorage', 'searchCache', 'userPreferences']
    return storageItems.includes(key)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <AlertTriangle className="w-6 h-6 text-destructive" />
          <h2 className="text-xl font-semibold text-foreground">Clear Data</h2>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          Select what data you want to clear. This action cannot be undone.
        </p>
      </div>

      {/* Statistics Overview */}
      {hasAnyData && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Current Data Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(statistics).map(([key, count]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <Badge variant={count > 0 ? "destructive" : "secondary"}>
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="text-center pt-2 border-t">
              <p className="text-lg font-semibold text-orange-800">
                Total Items: <span className="text-2xl">{statistics.total}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Select Data to Clear
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectAll(!selectAll)}
              >
                {selectAll ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Basic' : 'Advanced'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Options */}
          <div className="space-y-3">
            {(['favoriteChannels', 'favoriteVideos', 'videoNotes', 'watchedVideos'] as const).map((key) => {
              const Icon = getDataIcon(key as keyof ClearDataOptions)
              const count = getDataCount(key as keyof ClearDataOptions)
              return (
                <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={key}
                    checked={options[key as keyof ClearDataOptions]}
                    onCheckedChange={(checked) => handleOptionChange(key as keyof ClearDataOptions, checked)}
                  />
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <label htmlFor={key} className="text-sm font-medium cursor-pointer">
                        {getDataLabel(key as keyof ClearDataOptions)}
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      {count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      )}
                      {getStorageWarning(key as keyof ClearDataOptions) && (
                        <Badge variant="outline" className="text-xs">
                          Local
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Advanced Options</h4>
              {(['notebooks', 'noteLinks', 'playbackPositions', 'localStorage', 'searchCache', 'userPreferences'] as const).map((key) => {
                const Icon = getDataIcon(key as keyof ClearDataOptions)
                const count = getDataCount(key as keyof ClearDataOptions)
                return (
                  <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={key}
                      checked={options[key as keyof ClearDataOptions]}
                      onCheckedChange={(checked) => handleOptionChange(key as keyof ClearDataOptions, checked)}
                    />
                    <div className="flex items-center justify-between flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <label htmlFor={key} className="text-sm font-medium cursor-pointer">
                          {getDataLabel(key as keyof ClearDataOptions)}
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        {count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {count}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          Local
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning Section */}
      {selectedCount > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-destructive">Warning</h3>
                <p className="text-sm text-destructive/90">
                  You are about to permanently delete <strong>{selectedCount}</strong> type{selectedCount !== 1 ? 's' : ''} of data. 
                  This action cannot be undone and will immediately remove all selected information.
                </p>
                {selectedCount >= 5 && (
                  <p className="text-xs text-destructive/70 bg-destructive/10 p-2 rounded">
                    ⚠️ You're clearing a large amount of data. Consider creating a backup if needed.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleClearData}
          disabled={loading || selectedCount === 0}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-destructive border-t-transparent"></div>
              Clearing Data...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Selected Data ({selectedCount})
            </>
          )}
        </Button>
      </div>
    </div>
  )
}