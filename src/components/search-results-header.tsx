'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Search, Filter, X, Clock, TrendingUp, Users, Play } from 'lucide-react'

interface SearchResultsHeaderProps {
  searchQuery: string
  totalResults: number
  filters: {
    duration: string
    uploadDate: string
    sortBy: string
    videoType: string
  }
  onClearFilters: () => void
  className?: string
}

export function SearchResultsHeader({
  searchQuery,
  totalResults,
  filters,
  onClearFilters,
  className = ''
}: SearchResultsHeaderProps) {
  const getFilterLabel = (key: string, value: string) => {
    const labels: Record<string, Record<string, string>> = {
      duration: {
        short: 'Short (<4 min)',
        medium: 'Medium (4-20 min)',
        long: 'Long (>20 min)'
      },
      uploadDate: {
        hour: 'Last hour',
        today: 'Today',
        week: 'This week',
        month: 'This month',
        year: 'This year'
      },
      sortBy: {
        relevance: 'Most relevant',
        date: 'Upload date',
        rating: 'Rating',
        views: 'View count'
      },
      videoType: {
        video: 'Videos',
        channel: 'Channels',
        playlist: 'Playlists'
      }
    }
    
    return labels[key]?.[value] || value
  }

  const getActiveFilters = () => {
    return Object.entries(filters).filter(([key, value]) => value !== 'any')
  }

  const activeFilters = getActiveFilters()
  const hasActiveFilters = activeFilters.length > 0

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Query Display */}
      <div className="flex items-center gap-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">
            {searchQuery ? `Search results for "${searchQuery}"` : 'Trending videos'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalResults} {totalResults === 1 ? 'result' : 'results'} found
          </p>
        </div>
      </div>

      <Separator />

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Active filters</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(([key, value]) => (
              <Badge key={key} variant="secondary" className="text-xs">
                {getFilterLabel(key, value)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Updated just now</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          <span>High quality results</span>
        </div>
      </div>
    </div>
  )
}