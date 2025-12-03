'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  ShieldOff, 
  Eye, 
  Plus, 
  Trash2, 
  Edit, 
  Settings, 
  BarChart3, 
  Activity,
  Zap,
  Database,
  Filter,
  Tag,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Search,
  FolderOpen,
  FolderTree,
  Hash,
  Target,
  Gauge,
  Cpu,
  HardDrive
} from 'lucide-react'

interface FilterMetrics {
  totalRequests: number
  blockedRequests: number
  whitelistedRequests: number
  cacheHitRate: number
  avgResponseTime: number
  activeRules: number
}

interface Category {
  id: string
  name: string
  color: string
  description?: string
  isActive: boolean
  priority: number
  isSystem: boolean
  parentId?: string
  icon?: string
  itemCount?: number
  patternCount?: number
  hasChildren?: boolean
  level?: number
}

interface Pattern {
  id: string
  pattern: string
  type: string
  patternType: string
  isActive: boolean
  priority: number
  matchCount: number
  lastMatched?: string
  name?: string
  description?: string
  categoryId?: string
  severity: string
  source: string
  category?: Category
}

interface FilterResult {
  allowed: boolean
  blocked: boolean
  whitelisted: boolean
  reason?: string
  matchedBy?: 'blacklist' | 'whitelist' | 'pattern'
  matchedRule?: string
  confidence: number
  category?: string
  severity?: string
  cached: boolean
  responseTime: number
}

export function ProfessionalContentFilter() {
  const [activeTab, setActiveTab] = useState('overview')
  const [metrics, setMetrics] = useState<FilterMetrics | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreatePattern, setShowCreatePattern] = useState(false)
  const [testResults, setTestResults] = useState<FilterResult[]>([])
  const [testContent, setTestContent] = useState({
    title: '',
    channelName: '',
    description: '',
    tags: ''
  })

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  // Auto-refresh metrics
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'overview' || activeTab === 'performance') {
        loadMetrics()
      }
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadMetrics(),
        loadCategories(),
        loadPatterns()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/content-filter?details=true')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Error loading metrics:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories?includeStats=true')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadPatterns = async () => {
    try {
      const response = await fetch('/api/blacklist/patterns')
      if (response.ok) {
        const data = await response.json()
        setPatterns(data.patterns || [])
      }
    } catch (error) {
      console.error('Error loading patterns:', error)
    }
  }

  const testFilter = async () => {
    if (!testContent.title.trim()) {
      return
    }

    try {
      const response = await fetch('/api/content-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            id: 'test-item',
            itemId: 'test-id',
            type: 'video',
            title: testContent.title,
            channelName: testContent.channelName,
            description: testContent.description,
            tags: testContent.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
          }]
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTestResults(data.results || [])
      }
    } catch (error) {
      console.error('Error testing filter:', error)
    }
  }

  const clearCache = async () => {
    try {
      const response = await fetch('/api/content-filter', { method: 'DELETE' })
      if (response.ok) {
        const data = await response.json()
        // Show success message
        console.log('Cache cleared:', data.message)
      }
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-orange-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'low': return 'secondary'
      case 'medium': return 'default'
      case 'high': return 'secondary'
      case 'critical': return 'destructive'
      default: return 'outline'
    }
  }

  // Helper functions
  const toggleCategory = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      if (response.ok) {
        loadCategories()
      }
    } catch (error) {
      console.error('Error toggling category:', error)
    }
  }

  const editCategory = (category: Category) => {
    console.log('Edit category:', category)
    // TODO: Implement edit category dialog
  }

  const deleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        loadCategories()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const togglePattern = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/blacklist/patterns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      if (response.ok) {
        loadPatterns()
      }
    } catch (error) {
      console.error('Error toggling pattern:', error)
    }
  }

  const editPattern = (pattern: Pattern) => {
    console.log('Edit pattern:', pattern)
    // TODO: Implement edit pattern dialog
  }

  const deletePattern = async (pattern: Pattern) => {
    if (!confirm(`Are you sure you want to delete pattern "${pattern.name || pattern.pattern}"?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/blacklist/patterns/${pattern.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        loadPatterns()
      }
    } catch (error) {
      console.error('Error deleting pattern:', error)
    }
  }

  const createCategory = async (formData: FormData) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          description: formData.get('description'),
          color: formData.get('color')
        })
      })
      if (response.ok) {
        setShowCreateCategory(false)
        loadCategories()
      }
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  const createPattern = async (formData: FormData) => {
    try {
      const response = await fetch('/api/blacklist/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          pattern: formData.get('pattern'),
          type: formData.get('type'),
          patternType: formData.get('patternType'),
          severity: formData.get('severity'),
          categoryId: formData.get('categoryId') || null
        })
      })
      if (response.ok) {
        setShowCreatePattern(false)
        loadPatterns()
      }
    } catch (error) {
      console.error('Error creating pattern:', error)
    }
  }

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPatterns = patterns.filter(pattern =>
    pattern.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pattern.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pattern.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading content filter data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Professional Content Filter
          </h1>
          <p className="text-muted-foreground">
            Advanced content filtering with categories, patterns, and performance optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={clearCache}>
            <Database className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="w-4 h-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Test
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Lifetime requests</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Blocked Items</CardTitle>
                  <ShieldOff className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{metrics.blockedRequests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {((metrics.blockedRequests / metrics.totalRequests) * 100).toFixed(1)}% of requests
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Whitelisted Items</CardTitle>
                  <Eye className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{metrics.whitelistedRequests.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {((metrics.whitelistedRequests / metrics.totalRequests) * 100).toFixed(1)}% of requests
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                  <Zap className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{(metrics.cacheHitRate * 100).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Average efficiency</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCreateCategory(true)}>
              <CardContent className="flex items-center p-6">
                <Plus className="h-8 w-8 text-primary mr-4" />
                <div>
                  <h3 className="font-semibold">Create Category</h3>
                  <p className="text-sm text-muted-foreground">Organize your filters</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCreatePattern(true)}>
              <CardContent className="flex items-center p-6">
                <Hash className="h-8 w-8 text-primary mr-4" />
                <div>
                  <h3 className="font-semibold">Create Pattern</h3>
                  <p className="text-sm text-muted-foreground">Advanced filtering rules</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('test')}>
              <CardContent className="flex items-center p-6">
                <Target className="h-8 w-8 text-primary mr-4" />
                <div>
                  <h3 className="font-semibold">Test Filter</h3>
                  <p className="text-sm text-muted-foreground">Validate your rules</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowCreateCategory(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map(category => (
              <Card key={category.id} className={`${!category.isActive ? 'opacity-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      {category.isSystem && (
                        <Badge variant="secondary">System</Badge>
                      )}
                    </div>
                    <Switch 
                      checked={category.isActive}
                      disabled={category.isSystem}
                      onCheckedChange={(checked) => toggleCategory(category.id, checked)}
                    />
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-2">{category.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Priority:</span>
                      <Badge variant="outline">{category.priority}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Items:</span>
                      <span>{category.itemCount || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Patterns:</span>
                      <span>{category.patternCount || 0}</span>
                    </div>
                    {category.hasChildren && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FolderOpen className="w-4 h-4 mr-1" />
                        Has subcategories
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => editCategory(category)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {!category.isSystem && (
                      <Button variant="outline" size="sm" onClick={() => deleteCategory(category)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patterns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowCreatePattern(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Pattern
            </Button>
          </div>

          <div className="space-y-4">
            {filteredPatterns.map(pattern => (
              <Card key={pattern.id} className={`${!pattern.isActive ? 'opacity-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{pattern.name || pattern.pattern}</CardTitle>
                        <Badge variant={getSeverityBadgeVariant(pattern.severity)}>
                          {pattern.severity}
                        </Badge>
                        <Badge variant="outline">{pattern.patternType}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Type: {pattern.type} | Priority: {pattern.priority}
                      </p>
                      {pattern.description && (
                        <p className="text-sm text-muted-foreground mt-2">{pattern.description}</p>
                      )}
                    </div>
                    <Switch 
                      checked={pattern.isActive}
                      onCheckedChange={(checked) => togglePattern(pattern.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="p-3 bg-muted rounded font-mono text-sm">
                      {pattern.pattern}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Matches:</span>
                        <span className="ml-2 font-medium">{pattern.matchCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Matched:</span>
                        <span className="ml-2 font-medium">
                          {pattern.lastMatched ? new Date(pattern.lastMatched).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Source:</span>
                        <span className="ml-2 font-medium">{pattern.source}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <span className="ml-2 font-medium">{pattern.category?.name || 'None'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => editPattern(pattern)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deletePattern(pattern)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Avg Response Time:</span>
                    <span className="font-medium">{metrics.avgResponseTime.toFixed(2)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Hit Rate:</span>
                    <span className="font-medium">{(metrics.cacheHitRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Rules:</span>
                    <span className="font-medium">{metrics.activeRules}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Filter Engine: Operational</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Database: Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Cache: Active</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Content Filter</CardTitle>
              <p className="text-sm text-muted-foreground">
                Test your filtering rules with sample content
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="test-title">Title *</Label>
                  <Input
                    id="test-title"
                    placeholder="Enter content title..."
                    value={testContent.title}
                    onChange={(e) => setTestContent(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="test-channel">Channel Name</Label>
                  <Input
                    id="test-channel"
                    placeholder="Enter channel name..."
                    value={testContent.channelName}
                    onChange={(e) => setTestContent(prev => ({ ...prev, channelName: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="test-description">Description</Label>
                <Textarea
                  id="test-description"
                  placeholder="Enter content description..."
                  value={testContent.description}
                  onChange={(e) => setTestContent(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="test-tags">Tags (comma-separated)</Label>
                <Input
                  id="test-tags"
                  placeholder="Enter tags..."
                  value={testContent.tags}
                  onChange={(e) => setTestContent(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              <Button onClick={testFilter} disabled={!testContent.title.trim()}>
                <Target className="w-4 h-4 mr-2" />
                Test Filter
              </Button>
            </CardContent>
          </Card>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.allowed && !result.blocked && !result.whitelisted && (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-medium text-green-600">Allowed</span>
                            </>
                          )}
                          {result.blocked && (
                            <>
                              <XCircle className="w-5 h-5 text-red-600" />
                              <span className="font-medium text-red-600">Blocked</span>
                            </>
                          )}
                          {result.whitelisted && (
                            <>
                              <Eye className="w-5 h-5 text-blue-600" />
                              <span className="font-medium text-blue-600">Whitelisted</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {result.cached && (
                            <Badge variant="secondary">Cached</Badge>
                          )}
                          <Badge variant="outline">
                            {result.responseTime.toFixed(2)}ms
                          </Badge>
                        </div>
                      </div>
                      {result.reason && (
                        <p className="text-sm text-muted-foreground">{result.reason}</p>
                      )}
                      {result.matchedBy && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Matched by: </span>
                          <span className="font-medium">{result.matchedBy}</span>
                          {result.matchedRule && (
                            <>
                              <span className="text-muted-foreground"> (Rule: </span>
                              <span className="font-mono text-xs bg-muted px-1 rounded">
                                {result.matchedRule.substring(0, 8)}...
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}