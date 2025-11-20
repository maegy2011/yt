'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Plus, 
  SortAsc, 
  SortDesc, 
  Filter,
  Grid3X3,
  List,
  BookOpen,
  Eye,
  EyeOff
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { NotebookCard } from './NotebookCard'
import { Notebook } from '@/types/notes'

interface NotebookListProps {
  notebooks: Notebook[]
  loading?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onCreateNew?: () => void
  onEdit?: (notebook: Notebook) => void
  onDelete?: (notebook: Notebook) => void
  onSelect?: (notebook: Notebook) => void
  onToggleVisibility?: (notebook: Notebook) => void
  onAddNote?: (notebook: Notebook) => void
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'noteCount'
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  filterBy?: 'all' | 'public' | 'private'
  onFilterChange?: (filter: 'all' | 'public' | 'private') => void
  className?: string
}

export function NotebookList({
  notebooks,
  loading = false,
  searchQuery = '',
  onSearchChange,
  onCreateNew,
  onEdit,
  onDelete,
  onSelect,
  onToggleVisibility,
  onAddNote,
  viewMode = 'grid',
  onViewModeChange,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onSortChange,
  filterBy = 'all',
  onFilterChange,
  className = ''
}: NotebookListProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value)
    if (onSearchChange) {
      onSearchChange(value)
    }
  }

  const handleSortChange = (newSortBy: string) => {
    const newSortOrder = sortBy === newSortBy && sortOrder === 'asc' ? 'desc' : 'asc'
    if (onSortChange) {
      onSortChange(newSortBy, newSortOrder)
    }
  }

  const filteredNotebooks = notebooks.filter(notebook => {
    const matchesSearch = !localSearchQuery || 
      notebook.title.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      notebook.description?.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
      notebook.tags.toLowerCase().includes(localSearchQuery.toLowerCase())

    const matchesFilter = filterBy === 'all' || 
      (filterBy === 'public' && notebook.isPublic) ||
      (filterBy === 'private' && !notebook.isPublic)

    return matchesSearch && matchesFilter
  })

  const sortedNotebooks = [...filteredNotebooks].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'noteCount':
        aValue = a.noteCount || 0
        bValue = b.noteCount || 0
        break
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime()
        bValue = new Date(b.updatedAt).getTime()
        break
      case 'createdAt':
      default:
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <SortAsc className="h-4 w-4" />
    return sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
  }

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 p-4 border-b">
        {/* Search and Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notebooks..."
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={onCreateNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Notebook
          </Button>
        </div>

        {/* Filters and View Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {filterBy === 'all' ? 'All' : filterBy === 'public' ? 'Public' : 'Private'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuCheckboxItem
                  checked={filterBy === 'all'}
                  onCheckedChange={() => onFilterChange?.('all')}
                >
                  All Notebooks
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterBy === 'public'}
                  onCheckedChange={() => onFilterChange?.('public')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Public
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterBy === 'private'}
                  onCheckedChange={() => onFilterChange?.('private')}
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Private
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {getSortIcon(sortBy)}
                  <span className="ml-2 capitalize">{sortBy}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleSortChange('title')}>
                  {getSortIcon('title')}
                  <span className="ml-2">Title</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('createdAt')}>
                  {getSortIcon('createdAt')}
                  <span className="ml-2">Created</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('updatedAt')}>
                  {getSortIcon('updatedAt')}
                  <span className="ml-2">Updated</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSortChange('noteCount')}>
                  {getSortIcon('noteCount')}
                  <span className="ml-2">Note Count</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Results Count */}
            <Badge variant="secondary" className="text-xs">
              {sortedNotebooks.length} {sortedNotebooks.length === 1 ? 'notebook' : 'notebooks'}
            </Badge>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange?.('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange?.('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground">Loading notebooks...</p>
              </div>
            </div>
          ) : sortedNotebooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <BookOpen className="h-12 w-12 mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No notebooks found</h3>
              <p className="text-muted-foreground mb-4">
                {localSearchQuery ? 'Try adjusting your search or filters' : 'Create your first notebook to get started'}
              </p>
              {!localSearchQuery && (
                <Button onClick={onCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Notebook
                </Button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col gap-3'
            }>
              {sortedNotebooks.map((notebook) => (
                <NotebookCard
                  key={notebook.id}
                  notebook={notebook}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSelect={onSelect}
                  onToggleVisibility={onToggleVisibility}
                  onAddNote={onAddNote}
                  className={viewMode === 'list' ? 'w-full' : ''}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}