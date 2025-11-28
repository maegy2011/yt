'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Trash2, Search, BookOpen, Link } from 'lucide-react'

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
    setOptions(prev => ({ ...prev, [key]: checked }))
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    setOptions(prev => ({
      ...prev,
      favoriteChannels: checked,
      favoriteVideos: checked,
      videoNotes: checked,
      watchedVideos: checked,
      notebooks: checked,
      playbackPositions: checked,
      noteLinks: checked,
      localStorage: checked,
      searchCache: checked,
      userPreferences: checked
    }))
  }

  const handleClearData = async () => {
    await onClearData(options)
  }

  // Helper functions to get data for each option
  const getDataCount = (key: keyof ClearDataOptions): number => {
    switch (key) {
      case 'favoriteChannels':
        return statistics?.favoriteChannels || 0
      case 'favoriteVideos':
        return statistics?.favoriteVideos || 0
      case 'videoNotes':
        return statistics?.videoNotes || 0
      case 'watchedVideos':
        return statistics?.watchedVideos || 0
      case 'notebooks':
        return statistics?.notebooks || 0
      case 'playbackPositions':
        return statistics?.playbackPositions || 0
      case 'noteLinks':
        return statistics?.noteLinks || 0
      case 'localStorage':
        return 1 // Always available
      case 'searchCache':
        return 1 // Always available
      case 'userPreferences':
        return 1 // Always available
      default:
        return 0
    }
  }

  const getDataLabel = (key: keyof ClearDataOptions): string => {
    switch (key) {
      case 'favoriteChannels':
        return 'Favorite Channels'
      case 'favoriteVideos':
        return 'Favorite Videos'
      case 'videoNotes':
        return 'Video Notes'
      case 'watchedVideos':
        return 'Watched Videos'
      case 'notebooks':
        return 'Notebooks'
      case 'playbackPositions':
        return 'Playback Positions'
      case 'noteLinks':
        return 'Note Links'
      case 'localStorage':
        return 'Local Storage'
      case 'searchCache':
        return 'Search Cache'
      case 'userPreferences':
        return 'User Preferences'
      default:
        return key
    }
  }

  const getDataIcon = (key: keyof ClearDataOptions): React.ComponentType<any> => {
    switch (key) {
      case 'favoriteChannels':
        return BookOpen
      case 'favoriteVideos':
        return BookOpen
      case 'videoNotes':
        return BookOpen
      case 'watchedVideos':
        return BookOpen
      case 'notebooks':
        return BookOpen
      case 'playbackPositions':
        return BookOpen
      case 'noteLinks':
        return Link
      case 'localStorage':
        return Search
      case 'userPreferences':
        return Search
      default:
        return BookOpen
    }
  }

  const getStorageWarning = (key: keyof ClearDataOptions): boolean => {
    return ['localStorage', 'searchCache', 'userPreferences'].includes(key)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Clear Data
            <Badge variant="secondary" className="ml-2">
              {statistics?.total || 0} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Options */}
          {(['favoriteVideos', 'watchedVideos', 'favoriteChannels', 'notebooks', 'videoNotes', 'playbackPositions'] as const).map((key) => {
            const count = getDataCount(key as keyof ClearDataOptions)
            return (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={key}
                    checked={options[key as keyof ClearDataOptions]}
                    onCheckedChange={(checked) => handleOptionChange(key as keyof ClearDataOptions, checked as boolean)}
                  />
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
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
            )
          })}
          
          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Advanced Options</h4>
              {(['noteLinks', 'localStorage', 'searchCache', 'userPreferences'] as const).map((key) => {
                const count = getDataCount(key as keyof ClearDataOptions)
                return (
                  <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={key}
                      checked={options[key as keyof ClearDataOptions]}
                      onCheckedChange={(checked) => handleOptionChange(key as keyof ClearDataOptions, checked as boolean)}
                    />
                    <div className="flex items-center justify-between flex-1">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
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
                )
              })}
            </div>
          )}
          
          {/* Select All Option */}
          <div className="flex items-center justify-between p-3 border-t">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectAll}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All
              </label>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {selectedCount} of {statistics?.total || 0} selected
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearData}
              disabled={loading || selectedCount === 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Selected ({selectedCount})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}