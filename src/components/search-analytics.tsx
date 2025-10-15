'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Clock, Search, Target, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SearchAnalyticsProps {
  searchQuery: string
  totalResults: number
  searchTime: number
  filters: {
    duration: string
    uploadDate: string
    sortBy: string
    videoType: string
  }
  className?: string
}

interface SearchStats {
  avgSearchTime: number
  totalSearches: number
  successRate: number
  topFilters: string[]
}

export function SearchAnalytics({ 
  searchQuery, 
  totalResults, 
  searchTime, 
  filters, 
  className = '' 
}: SearchAnalyticsProps) {
  const [stats, setStats] = useState<SearchStats>({
    avgSearchTime: 0,
    totalSearches: 0,
    successRate: 0,
    topFilters: []
  })

  useEffect(() => {
    // Load analytics data from localStorage
    const savedStats = localStorage.getItem('newpipe-search-analytics')
    if (savedStats) {
      setStats(JSON.parse(savedStats))
    }
  }, [])

  const getFilterIcon = (filterName: string) => {
    switch (filterName) {
      case 'duration':
        return <Clock className="h-3 w-3" />
      case 'uploadDate':
        return <TrendingUp className="h-3 w-3" />
      case 'sortBy':
        return <Target className="h-3 w-3" />
      case 'videoType':
        return <Zap className="h-3 w-3" />
      default:
        return <Search className="h-3 w-3" />
    }
  }

  const getActiveFilters = () => {
    return Object.entries(filters).filter(([key, value]) => value !== 'any')
  }

  const activeFilters = getActiveFilters()
  const hasActiveFilters = activeFilters.length > 0

  const getSearchQuality = () => {
    if (totalResults === 0) return 'poor'
    if (totalResults < 5) return 'fair'
    if (totalResults < 20) return 'good'
    return 'excellent'
  }

  const getQualityColor = () => {
    const quality = getSearchQuality()
    switch (quality) {
      case 'excellent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'good':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'poor':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getQualityLabel = () => {
    const quality = getSearchQuality()
    return quality.charAt(0).toUpperCase() + quality.slice(1)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Quality Score */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Search Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Search Quality</p>
              <Badge className={getQualityColor()}>
                {getQualityLabel()}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Results Found</p>
              <p className="text-lg font-semibold">{totalResults}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Search Time</p>
              <p className="font-medium">{searchTime.toFixed(2)}s</p>
            </div>
            <div>
              <p className="text-muted-foreground">Query Length</p>
              <p className="font-medium">{searchQuery.length} chars</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {hasActiveFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Active Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeFilters.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getFilterIcon(key)}
                    <span className="capitalize">{key}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Search Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="space-y-1">
            <p className="font-medium">For better results:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Use specific keywords</li>
              <li>• Try different filters</li>
              <li>• Check spelling</li>
              <li>• Use broader terms</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Avg. Search Time</span>
            <span className="font-medium">{stats.avgSearchTime.toFixed(2)}s</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Success Rate</span>
            <span className="font-medium">{stats.successRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Searches</span>
            <span className="font-medium">{stats.totalSearches}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}