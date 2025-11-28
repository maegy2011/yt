'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  ShieldOff, 
  Trash2, 
  Search, 
  Filter,
  Download,
  Upload,
  Eye,
  EyeOff,
  BarChart3,
  X,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Video,
  List,
  MoreVertical,
  RefreshCw
} from 'lucide-react'

type ItemType = 'video' | 'playlist' | 'channel' | 'all'
type SortBy = 'addedAt' | 'title' | 'type'
type SortOrder = 'asc' | 'desc'

interface BlacklistedItem {
  id: string
  itemId: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
  addedAt: string
  updatedAt: string
}

interface BlacklistStats {
  total: number
  recent: number
  byType: Record<string, number>
  types: Array<{ type: string; count: number }>
}

interface BlacklistManagerProps {
  isOpen: boolean
  onClose: () => void
  type: 'blacklist' | 'whitelist'
}

// API functions
const fetchBlacklistItems = async (
  type: 'blacklist' | 'whitelist',
  filters: {
    itemType?: ItemType
    search?: string
    page?: number
    limit?: number
    sortBy?: SortBy
    sortOrder?: SortOrder
  }
) => {
  const params = new URLSearchParams()
  if (filters.itemType && filters.itemType !== 'all') params.append('type', filters.itemType)
  if (filters.search) params.append('search', filters.search)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.sortBy) params.append('sortBy', filters.sortBy)
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

  const response = await fetch(`/api/${type}?${params}`)
  if (!response.ok) throw new Error(`Failed to fetch ${type}`)
  return await response.json()
}

const fetchBlacklistStats = async (type: 'blacklist' | 'whitelist') => {
  const response = await fetch(`/api/${type}`, { method: 'PUT' })
  if (!response.ok) throw new Error(`Failed to fetch ${type} statistics`)
  return await response.json()
}

const deleteBlacklistItems = async (
  type: 'blacklist' | 'whitelist',
  operation: 'single' | 'batch',
  data: any
) => {
  const url = operation === 'batch' ? `/api/${type}?batch=true` : `/api/${type}?itemId=${data.itemId}`
  const response = await fetch(url, {
    method: 'DELETE',
    headers: operation === 'batch' ? { 'Content-Type': 'application/json' } : undefined,
    body: operation === 'batch' ? JSON.stringify(data) : undefined
  })
  if (!response.ok) throw new Error(`Failed to delete from ${type}`)
  return await response.json()
}

const bulkAddToBlacklist = async (type: 'blacklist' | 'whitelist', items: any[]) => {
  const response = await fetch(`/api/${type}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation: 'bulk-add', items })
  })
  if (!response.ok) throw new Error(`Failed to bulk add to ${type}`)
  return await response.json()
}

export function BlacklistManager({ isOpen, onClose, type }: BlacklistManagerProps) {
  const [items, setItems] = useState<BlacklistedItem[]>([])
  const [stats, setStats] = useState<BlacklistStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [itemType, setItemType] = useState<ItemType>('all')
  const [sortBy, setSortBy] = useState<SortBy>('addedAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Dialog states
  const [showBulkAddDialog, setShowBulkAddDialog] = useState(false)
  const [showClearConfirmDialog, setShowClearConfirmDialog] = useState(false)
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  const [bulkAddText, setBulkAddText] = useState('')

  const isWhitelist = type === 'whitelist'
  const icon = isWhitelist ? Shield : ShieldOff
  const title = isWhitelist ? 'Whitelist Manager' : 'Blacklist Manager'
  const color = isWhitelist ? 'text-green-600' : 'text-destructive'

  // Load items
  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchBlacklistItems(type, {
        itemType,
        search: searchQuery,
        page: currentPage,
        limit: 20,
        sortBy,
        sortOrder
      })
      setItems(result.items || [])
      setTotalPages(result.pagination?.pages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }, [type, itemType, searchQuery, currentPage, sortBy, sortOrder])

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const result = await fetchBlacklistStats(type)
      setStats(result)
    } catch (err) {
      // Failed to load stats
    }
  }, [type])

  useEffect(() => {
    if (isOpen) {
      loadItems()
      loadStats()
    }
  }, [isOpen, loadItems, loadStats])

  // Handle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map(item => item.itemId)))
    }
  }

  // Handle delete operations
  const deleteSelectedItems = async () => {
    if (selectedItems.size === 0) return
    
    setLoading(true)
    try {
      const result = await deleteBlacklistItems(type, 'batch', {
        itemIds: Array.from(selectedItems)
      })
      
      if (result.success) {
        setSelectedItems(new Set())
        await loadItems()
        await loadStats()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete items')
    } finally {
      setLoading(false)
    }
  }

  const clearAllItems = async () => {
    setLoading(true)
    try {
      const result = await deleteBlacklistItems(type, 'batch', {
        confirm: 'clear-all'
      })
      
      if (result.success) {
        setSelectedItems(new Set())
        await loadItems()
        await loadStats()
        setShowClearConfirmDialog(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear items')
    } finally {
      setLoading(false)
    }
  }

  // Handle bulk add
  const handleBulkAdd = async () => {
    if (!bulkAddText.trim()) return
    
    setLoading(true)
    try {
      // Parse text input (one item per line, format: title|type|channel)
      const lines = bulkAddText.trim().split('\n')
      const itemsToAdd = lines.map(line => {
        const parts = line.split('|').map(p => p.trim())
        return {
          itemId: `custom-${Date.now()}-${Math.random()}`,
          title: parts[0] || 'Unknown',
          type: parts[1] || 'video',
          channelName: parts[2] || undefined
        }
      }).filter(item => item.title)

      const result = await bulkAddToBlacklist(type, itemsToAdd)
      
      if (result.success) {
        setBulkAddText('')
        setShowBulkAddDialog(false)
        await loadItems()
        await loadStats()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add items')
    } finally {
      setLoading(false)
    }
  }

  // Export/Import functions
  const exportList = () => {
    const dataStr = JSON.stringify(items, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `${type}-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importList = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importedItems = JSON.parse(e.target?.result as string)
        if (Array.isArray(importedItems)) {
          const result = await bulkAddToBlacklist(type, importedItems)
          if (result.success) {
            await loadItems()
            await loadStats()
          }
        }
      } catch (err) {
        setError('Failed to import file')
      }
    }
    reader.readAsText(file)
  }

  const getTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'video': return Video
      case 'playlist': return List
      case 'channel': return Users
      default: return Shield
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {React.createElement(icon, { className: `w-5 h-5 ${color}` })}
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Stats Bar */}
          {stats && (
            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total: {stats.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Recent: {stats.recent}</span>
              </div>
              {stats.types.map(stat => (
                <Badge key={stat.type} variant="secondary" className="text-xs">
                  {stat.type}: {stat.count}
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStatsDialog(true)}
                className="ml-auto"
              >
                <TrendingUp className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={itemType} onValueChange={(value: ItemType) => setItemType(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="playlist">Playlists</SelectItem>
                <SelectItem value="channel">Channels</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="addedAt">Date Added</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadItems}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedItems.size === items.length && items.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedItems.size > 0 && `${selectedItems.size} selected`}
              </span>
              {selectedItems.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelectedItems}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkAddDialog(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Bulk Add
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={exportList}
                disabled={items.length === 0}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-1" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={importList}
                  className="hidden"
                />
              </label>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowClearConfirmDialog(true)}
                disabled={items.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Items List */}
          <ScrollArea className="flex-1 border rounded-lg">
            <div className="p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {React.createElement(icon, { className: "w-12 h-12 mx-auto mb-2 opacity-50" })}
                  <p>No items found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => {
                    const TypeIcon = getTypeIcon(item.type)
                    const isSelected = selectedItems.has(item.itemId)
                    
                    return (
                      <Card
                        key={item.itemId}
                        className={`p-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleItemSelection(item.itemId)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItemSelection(item.itemId)}
                          />
                          
                          {item.thumbnail && (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <TypeIcon className="w-4 h-4 text-muted-foreground" />
                              <Badge variant="outline" className="text-xs">
                                {item.type}
                              </Badge>
                              {item.channelName && (
                                <span className="text-xs text-muted-foreground">
                                  {item.channelName}
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium truncate">{item.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              Added {formatDate(item.addedAt)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Bulk Add Dialog */}
        <Dialog open={showBulkAddDialog} onOpenChange={setShowBulkAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Add Items</DialogTitle>
              <DialogDescription>
                Add multiple items at once. One item per line in format: title|type|channel
              </DialogDescription>
            </DialogHeader>
            <textarea
              className="w-full h-32 p-3 border rounded-md"
              placeholder="Example Video Title|video|Channel Name&#10;Another Video|video|Another Channel&#10;Playlist Name|playlist|Channel Name"
              value={bulkAddText}
              onChange={(e) => setBulkAddText(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAdd} disabled={!bulkAddText.trim() || loading}>
                Add Items
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Clear All Confirmation Dialog */}
        <Dialog open={showClearConfirmDialog} onOpenChange={setShowClearConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear All Items?</DialogTitle>
              <DialogDescription>
                This will permanently remove all {stats?.total || 0} items from your {type}. 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowClearConfirmDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={clearAllItems} disabled={loading}>
                Clear All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats Dialog */}
        <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{title} Statistics</DialogTitle>
            </DialogHeader>
            {stats && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.total}</p>
                          <p className="text-sm text-muted-foreground">Total Items</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.recent}</p>
                          <p className="text-sm text-muted-foreground">Added This Week</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">By Type</h4>
                  {stats.types.map(stat => {
                    const TypeIcon = getTypeIcon(stat.type)
                    return (
                      <div key={stat.type} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4" />
                          <span className="capitalize">{stat.type}</span>
                        </div>
                        <Badge variant="secondary">{stat.count}</Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}