'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Clock, TrendingUp, Filter, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface SearchSuggestion {
  text: string
  type: 'trending' | 'history' | 'suggestion'
}

interface SearchFilters {
  duration: 'any' | 'short' | 'medium' | 'long'
  uploadDate: 'any' | 'hour' | 'today' | 'week' | 'month' | 'year'
  sortBy: 'relevance' | 'date' | 'rating' | 'views'
  videoType: 'any' | 'video' | 'channel' | 'playlist'
}

interface EnhancedSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void
  initialQuery?: string
  isLoading?: boolean
  className?: string
}

export function EnhancedSearch({ onSearch, initialQuery = '', isLoading = false, className = '' }: EnhancedSearchProps) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    duration: 'any',
    uploadDate: 'any',
    sortBy: 'relevance',
    videoType: 'any'
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('newpipe-search-history')
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }
  }, [])

  // Mock trending searches (in a real app, these would come from an API)
  const trendingSearches = [
    'music videos',
    'tech reviews',
    'gaming streams',
    'news today',
    'tutorials',
    'comedy',
    'documentaries',
    'fitness workouts'
  ]

  const handleInputChange = (value: string) => {
    setQuery(value)
    
    if (value.length > 1) {
      // Generate suggestions based on input
      const newSuggestions: SearchSuggestion[] = []
      
      // Add trending searches that match
      trendingSearches
        .filter(search => search.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 3)
        .forEach(search => {
          newSuggestions.push({ text: search, type: 'trending' })
        })
      
      // Add search history that matches
      searchHistory
        .filter(search => search.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 2)
        .forEach(search => {
          newSuggestions.push({ text: search, type: 'history' })
        })
      
      setSuggestions(newSuggestions)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return
    
    // Add to search history
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('newpipe-search-history', JSON.stringify(newHistory))
    
    // Perform search
    onSearch(searchQuery, filters)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    handleSearch(suggestion.text)
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      duration: 'any',
      uploadDate: 'any',
      sortBy: 'relevance',
      videoType: 'any'
    })
  }

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== 'any').length
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search videos, channels, playlists..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-20"
        />
        
        {/* Filter button */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-12 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
            >
              <Filter className="h-4 w-4" />
              {getActiveFiltersCount() > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Search Filters</SheetTitle>
              <SheetDescription>
                Customize your search results with these filters
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration</label>
                <Select value={filters.duration} onValueChange={(value) => handleFilterChange('duration', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any duration</SelectItem>
                    <SelectItem value="short">Under 4 minutes</SelectItem>
                    <SelectItem value="medium">4-20 minutes</SelectItem>
                    <SelectItem value="long">Over 20 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Date</label>
                <Select value={filters.uploadDate} onValueChange={(value) => handleFilterChange('uploadDate', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any time</SelectItem>
                    <SelectItem value="hour">Last hour</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="year">This year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Most relevant</SelectItem>
                    <SelectItem value="date">Upload date</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="views">View count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={filters.videoType} onValueChange={(value) => handleFilterChange('videoType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any type</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="channel">Channel</SelectItem>
                    <SelectItem value="playlist">Playlist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={clearFilters} variant="outline" className="flex-1">
                  Clear Filters
                </Button>
                <Button onClick={() => setIsFilterOpen(false)} className="flex-1">
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Search button */}
        <Button
          onClick={() => handleSearch()}
          className="absolute right-1 top-1/2 h-7 -translate-y-1/2"
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
          <ScrollArea className="max-h-60">
            <CardContent className="p-0">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.type === 'trending' ? (
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="text-sm">{suggestion.text}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {suggestion.type === 'trending' ? 'Trending' : 'History'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </ScrollArea>
        </Card>
      )}

      {/* Quick search history */}
      {query === '' && searchHistory.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-2">Recent searches</p>
          <div className="flex flex-wrap gap-1">
            {searchHistory.slice(0, 5).map((item, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => {
                  setQuery(item)
                  handleSearch(item)
                }}
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}