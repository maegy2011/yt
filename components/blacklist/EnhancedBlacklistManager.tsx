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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
  RefreshCw,
  Zap,
  Database,
  FileText,
  Settings,
  PlayCircle,
  PauseCircle
} from 'lucide-react'

type ItemType = 'video' | 'playlist' | 'channel' | 'all'
type SortBy = 'addedAt' | 'title' | 'type' | 'priority'
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
  priority?: number
  batchId?: string
  videoHash?: string
  channelHash?: string
  isChannelBlock?: boolean
}

interface WhitelistedItem {
  id: string
  itemId: string
  title: string
  type: 'video' | 'playlist' | 'channel'
  thumbnail?: string
  channelName?: string
  addedAt: string
  updatedAt: string
  priority?: number
  batchId?: string
  videoHash?: string
  channelHash?: string
  isChannelWhitelist?: boolean
}

interface BlacklistPattern {
  id: string
  pattern: string
  type: 'title' | 'channel' | 'description' | 'tags'
  patternType: 'keyword' | 'regex' | 'wildcard'
  isActive: boolean
  priority: number
  matchCount: number
  lastMatched?: string
  createdAt: string
  updatedAt: string
}

interface BlacklistBatch {
  id: string
  name?: string
  description?: string
  source: 'file' | 'api' | 'manual'
  itemCount: number
  successCount: number
  errorCount: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  filePath?: string
  metadata?: string
  createdAt: string
  updatedAt: string
}

interface BlacklistStats {
  total: number
  recent: number
  byType: Record<string, number>
  types: Array<{ type: string; count: number }>
  performance?: {
    avgProcessingTime: number
    totalFilterHits: number
    cacheHitRate: number
  }
}

interface BulkImportProgress {
  batchId: string
  total: number
  processed: number
  success: number
  failed: number
  isComplete: boolean
  errors: string[]
}

interface BlacklistManagerProps {
  isOpen: boolean
  onClose: () => void
  type: 'blacklist' | 'whitelist'
}

// Enhanced API functions for large-scale operations
const fetchBlacklistItems = async (
  type: 'blacklist' | 'whitelist',
  filters: {
    itemType?: ItemType
    search?: string
    page?: number
    limit?: number
    sortBy?: SortBy
    sortOrder?: SortOrder
    batchId?: string
  }
) => {
  const params = new URLSearchParams()
  if (filters.itemType && filters.itemType !== 'all') params.append('type', filters.itemType)
  if (filters.search) params.append('search', filters.search)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())
  if (filters.sortBy) params.append('sortBy', filters.sortBy)
  if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
  if (filters.batchId) params.append('batchId', filters.batchId)

  const response = await fetch(`/api/${type}?${params}`)
  if (!response.ok) throw new Error(`Failed to fetch ${type}`)
  return await response.json()
}

const fetchBlacklistPatterns = async () => {
  const response = await fetch('/api/blacklist/patterns')
  if (!response.ok) throw new Error('Failed to fetch patterns')
  return await response.json()
}

const fetchBlacklistBatches = async () => {
  const response = await fetch('/api/blacklist/batches')
  if (!response.ok) throw new Error('Failed to fetch batches')
  return await response.json()
}

const createBlacklistPattern = async (
  pattern: Omit<BlacklistPattern, 'id' | 'createdAt' | 'updatedAt' | 'matchCount' | 'lastMatched'>
) => {
  const response = await fetch('/api/blacklist/patterns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pattern)
  })
  if (!response.ok) throw new Error('Failed to create pattern')
  return await response.json()
}

const deleteBlacklistPattern = async (patternId: string) => {
  const response = await fetch(`/api/blacklist/patterns/${patternId}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Failed to delete pattern')
  return await response.json()
}

const bulkImportItems = async (
  type: 'blacklist' | 'whitelist',
  data: {
    items: any[]
    batchName?: string
    description?: string
    chunkSize?: number
    skipDuplicates?: boolean
  }
) => {
  const response = await fetch(`/api/${type}/bulk-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error(`Failed to bulk import to ${type}`)
  return await response.json()
}

export function EnhancedBlacklistManager({ isOpen, onClose, type }: BlacklistManagerProps) {
  const [activeTab, setActiveTab] = useState('items')
  const [items, setItems] = useState<BlacklistedItem[] | WhitelistedItem[]>([])
  const [patterns, setPatterns] = useState<BlacklistPattern[]>([])
  const [batches, setBatches] = useState<BlacklistBatch[]>([])
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
  const [selectedBatchId, setSelectedBatchId] = useState<string>('')
  
  // Bulk import states
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false)
  const [bulkImportText, setBulkImportText] = useState('')
  const [importProgress, setImportProgress] = useState<BulkImportProgress | null>(null)
  const [currentBatchId, setCurrentBatchId] = useState<string>('')
  
  // Pattern management states
  const [showPatternDialog, setShowPatternDialog] = useState(false)
  const [newPattern, setNewPattern] = useState({
    pattern: '',
    type: 'title' as 'title' | 'channel' | 'description' | 'tags',
    patternType: 'keyword' as 'keyword' | 'regex' | 'wildcard',
    priority: 0,
    isActive: true
  })

  const isWhitelist = type === 'whitelist'
  const icon = isWhitelist ? Shield : ShieldOff
  const title = isWhitelist ? 'Enhanced Whitelist Manager' : 'Enhanced Blacklist Manager'
  const color = isWhitelist ? 'text-green-600' : 'text-destructive'

  // Load data
  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchBlacklistItems(type, {
        itemType,
        search: searchQuery,
        page: currentPage,
        limit: 50,
        sortBy,
        sortOrder,
        batchId: selectedBatchId || undefined
      })
      setItems(result.items || [])
      setTotalPages(result.pagination?.pages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }, [type, itemType, searchQuery, currentPage, sortBy, sortOrder, selectedBatchId])

  const loadPatterns = useCallback(async () => {
    try {
      const result = await fetchBlacklistPatterns()
      setPatterns(result.patterns || [])
    } catch (err) {
      // Failed to load patterns
    }
  }, [])

  const loadBatches = useCallback(async () => {
    try {
      const result = await fetchBlacklistBatches()
      setBatches(result.batches || [])
    } catch (err) {
      // Failed to load batches
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/${type}`, { method: 'PUT' })
      if (response.ok) {
        const result = await response.json()
        setStats(result)
      }
    } catch (err) {
      // Failed to load stats
    }
  }, [type])

  useEffect(() => {
    if (isOpen) {
      loadItems()
      loadPatterns()
      loadBatches()
      loadStats()
    }
  }, [isOpen, loadItems, loadPatterns, loadBatches, loadStats])

  // Bulk import handler
  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Parse text input (one item per line, format: title|type|channel|priority)
      const lines = bulkImportText.trim().split('\n')
      const items = lines.map(line => {
        const parts = line.split('|').map(p => p.trim())
        return {
          itemId: `custom-${Date.now()}-${Math.random()}`,
          title: parts[0] || 'Unknown',
          type: parts[1] || 'video',
          channelName: parts[2] || undefined,
          priority: parseInt(parts[3]) || 0
        }
      }).filter(item => item.title)

      const result = await bulkImportItems(type, {
        items,
        batchName: `Manual Import ${new Date().toLocaleString()}`,
        description: `Import of ${items.length} items from text input`,
        chunkSize: 100,
        skipDuplicates: true
      })
      
      if (result.success) {
        setBulkImportText('')
        setShowBulkImportDialog(false)
        setCurrentBatchId(result.batchId)
        
        // Start polling for progress
        const pollProgress = async () => {
          try {
            const progress = await getImportProgress(result.batchId)
            const progress = await getImportProgress(result.batchId)
            setImportProgress(progress)
            
            if (!progress.isComplete) {
              setTimeout(pollProgress, 1000) // Poll every second
            } else {
              setImportProgress(null)
              setCurrentBatchId('')
              await loadItems()
              await loadBatches()
              await loadStats()
            }
          } catch (error) {
            // Failed to get progress
          }
        }
        
        pollProgress()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import items')
    } finally {
      setLoading(false)
    }
  }

  // Pattern management
  const handleCreatePattern = async () => {
    if (!newPattern.pattern.trim()) return
    
    try {
      const result = await createBlacklistPattern({
        pattern: newPattern.pattern.trim(),
        type: newPattern.type,
        patternType: newPattern.patternType,
        priority: newPattern.priority,
        isActive: newPattern.isActive
      })
      
      setNewPattern({
        pattern: '',
        type: 'title',
        patternType: 'keyword',
        priority: 0,
        isActive: true
      })
      setShowPatternDialog(false)
      await loadPatterns()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pattern')
    }
  }

  const handleDeletePattern = async (patternId: string) => {
    try {
      await deleteBlacklistPattern(patternId)
      await loadPatterns()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pattern')
    }
  }

  // File import handler
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const text = await file.text()
      let items: any[] = []

      if (file.name.endsWith('.json')) {
        // JSON import
        const jsonData = JSON.parse(text)
        items = Array.isArray(jsonData) ? jsonData : [jsonData]
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        // CSV/TXT import
        const lines = text.split('\n').filter(line => line.trim())
        items = lines.map((line, index) => {
          const parts = line.split(',').map(p => p.trim().replace(/"/g, ''))
          return {
            itemId: parts[0] || `import-${Date.now()}-${index}`,
            title: parts[1] || `Item ${index + 1}`,
            type: parts[2] || 'video',
            channelName: parts[3] || undefined,
            priority: parseInt(parts[4]) || 0
          }
        })
      }

      if (items.length > 0) {
        const result = await bulkImportItems(type, {
          items,
          batchName: `File Import: ${file.name}`,
          description: `Import of ${items.length} items from ${file.name}`,
          chunkSize: 100,
          skipDuplicates: true
        })
        
        if (result.success) {
          setCurrentBatchId(result.batchId)
          // Start progress polling (same as manual import)
          const pollProgress = async () => {
            try {
              const progress = await getImportProgress(result.batchId)
              setImportProgress(progress)
              
              if (!progress.isComplete) {
                setTimeout(pollProgress, 1000)
              } else {
                setImportProgress(null)
                setCurrentBatchId('')
                await loadItems()
                await loadBatches()
                await loadStats()
              }
            } catch (error) {
              // Failed to get progress
            }
          }
          
          pollProgress()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file')
    } finally {
      setLoading(false)
    }
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
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {React.createElement(icon, { className: `w-5 h-5 ${color}` })}
            {title}
            <Badge variant="outline" className="ml-2">
              <Zap className="w-3 h-3 mr-1" />
              Enhanced
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Stats Bar */}
          {stats && (
            <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-muted-foreground" />
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
              {stats.performance && (
                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant="outline" className="text-xs">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {stats.performance.avgProcessingTime.toFixed(1)}ms avg
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stats.performance.totalFilterHits} hits
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Import Progress */}
          {importProgress && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Bulk Import Progress</span>
                  <Badge variant="outline">
                    {importProgress.processed}/{importProgress.total}
                  </Badge>
                </div>
                <Progress 
                  value={(importProgress.processed / importProgress.total) * 100} 
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Success: {importProgress.success}</span>
                  <span>Failed: {importProgress.failed}</span>
                  <span>{importProgress.isComplete ? 'Complete' : 'Processing...'}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
              <TabsTrigger value="batches">Batches</TabsTrigger>
              <TabsTrigger value="import">Import</TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="flex-1 flex flex-col min-h-0 mt-4">
              {/* Enhanced Items Management */}
              <div className="flex-1 flex flex-col min-h-0">
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

                  <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Batches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Batches</SelectItem>
                      {batches.map(batch => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name || batch.id}
                        </SelectItem>
                      ))}
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
                      <SelectItem value="priority">Priority</SelectItem>
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
                        {items.map((item: any) => {
                          const TypeIcon = getTypeIcon(item.type)
                          const isSelected = selectedItems.has(item.itemId)
                          
                          return (
                            <Card
                              key={item.itemId}
                              className={`p-3 cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                              }`}
                              onClick={() => setSelectedItems(prev => {
                                const newSet = new Set(prev)
                                if (newSet.has(item.itemId)) {
                                  newSet.delete(item.itemId)
                                } else {
                                  newSet.add(item.itemId)
                                }
                                return newSet
                              })}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => {}}
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
                                    {item.priority > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        Priority: {item.priority}
                                      </Badge>
                                    )}
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
              </div>
            </TabsContent>

            <TabsContent value="patterns" className="flex-1 flex flex-col min-h-0 mt-4">
              {/* Pattern Management */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Pattern-Based Blocking</h3>
                  <Button
                    onClick={() => setShowPatternDialog(true)}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Pattern
                  </Button>
                </div>

                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="p-2">
                    {patterns.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No patterns defined</p>
                        <p className="text-sm">Create patterns to block content by keywords, regex, or wildcards</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {patterns.map((pattern) => (
                          <Card key={pattern.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline">{pattern.type}</Badge>
                                  <Badge variant="secondary">{pattern.patternType}</Badge>
                                  {pattern.isActive ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <PauseCircle className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                                <code className="text-sm bg-muted p-1 rounded">{pattern.pattern}</code>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Priority: {pattern.priority} | Matches: {pattern.matchCount}
                                  {pattern.lastMatched && ` | Last: ${formatDate(pattern.lastMatched)}`}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePattern(pattern.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="batches" className="flex-1 flex flex-col min-h-0 mt-4">
              {/* Batch Management */}
              <div className="flex-1 flex flex-col min-h-0">
                <h3 className="text-lg font-medium mb-4">Import History</h3>
                
                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="p-2">
                    {batches.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No import history</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {batches.map((batch) => (
                          <Card key={batch.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge 
                                    variant={batch.status === 'completed' ? 'default' : 
                                           batch.status === 'processing' ? 'secondary' :
                                           batch.status === 'failed' ? 'destructive' : 'outline'}
                                  >
                                    {batch.status}
                                  </Badge>
                                  <span className="font-medium">{batch.name || batch.id}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {batch.description}
                                </p>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Items: {batch.itemCount} | Success: {batch.successCount} | Failed: {batch.errorCount}
                                  {batch.createdAt && ` | ${formatDate(batch.createdAt)}`}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {batch.status === 'processing' && (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="import" className="flex-1 flex flex-col min-h-0 mt-4">
              {/* Import Interface */}
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Bulk Import</h3>
                  <p className="text-sm text-muted-foreground">
                    Import thousands of items at once. Supports JSON, CSV, and text formats.
                  </p>
                </div>

                {/* File Import */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">File Import</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Upload File (JSON, CSV, TXT)
                        </label>
                        <input
                          type="file"
                          accept=".json,.csv,.txt"
                          onChange={handleFileImport}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                        />
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <p><strong>JSON format:</strong> Array of objects with itemId, title, type, channelName, priority</p>
                        <p><strong>CSV format:</strong> itemId,title,type,channelName,priority</p>
                        <p><strong>TXT format:</strong> title|type|channel|priority (one per line)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Manual Import */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Manual Import</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Paste Items (one per line: title|type|channel|priority)
                        </label>
                        <textarea
                          className="w-full h-32 p-3 border rounded-md"
                          placeholder="Example Video Title|video|Channel Name|1"
                          value={bulkImportText}
                          onChange={(e) => setBulkImportText(e.target.value)}
                        />
                      </div>
                      
                      <Button
                        onClick={handleBulkImport}
                        disabled={loading || !bulkImportText.trim()}
                        className="w-full"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Import Items
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Import Guidelines */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Import Guidelines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Maximum 50,000 items per batch for optimal performance</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Duplicate items are automatically skipped</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Items are processed in chunks of 100 for better performance</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>Large imports may take several minutes to complete</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </DialogContent>

      {/* Pattern Creation Dialog */}
      <Dialog open={showPatternDialog} onOpenChange={setShowPatternDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Block Pattern</DialogTitle>
            <DialogDescription>
              Create a pattern to block content by keywords, regex, or wildcards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Pattern</label>
              <Input
                value={newPattern.pattern}
                onChange={(e) => setNewPattern(prev => ({ ...prev, pattern: e.target.value }))}
                placeholder="Enter pattern (keyword, regex, or wildcard)"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <Select 
                  value={newPattern.type} 
                  onValueChange={(value: any) => setNewPattern(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="channel">Channel</SelectItem>
                    <SelectItem value="description">Description</SelectItem>
                    <SelectItem value="tags">Tags</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Pattern Type</label>
                <Select 
                  value={newPattern.patternType} 
                  onValueChange={(value: any) => setNewPattern(prev => ({ ...prev, patternType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Keyword</SelectItem>
                    <SelectItem value="regex">Regex</SelectItem>
                    <SelectItem value="wildcard">Wildcard (*, ?)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <Input
                type="number"
                value={newPattern.priority}
                onChange={(e) => setNewPattern(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                placeholder="0 (highest priority first)"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                checked={newPattern.isActive}
                onCheckedChange={(checked) => setNewPattern(prev => ({ ...prev, isActive: checked as boolean }))}
              />
              <label className="text-sm">Active</label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPatternDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePattern}>
              Create Pattern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}