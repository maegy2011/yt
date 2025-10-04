'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Video, 
  BarChart3, 
  Settings, 
  LogOut,
  Plus,
  Search,
  Filter,
  Activity,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface SystemStats {
  totalVideos: number
  activeVideos: number
  totalChannels: number
  totalUsers: number
}

interface QuotaInfo {
  used: number
  total: number
  remaining: number
  percentage: number
  status: 'normal' | 'warning' | 'critical'
}

interface RecentActivity {
  id: number
  action: string
  target_type: string
  target_id: string
  created_at: string
  user?: {
    email: string
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<SystemStats>({
    totalVideos: 0,
    activeVideos: 0,
    totalChannels: 0,
    totalUsers: 0
  })
  const [quota, setQuota] = useState<QuotaInfo>({
    used: 0,
    total: 10000,
    remaining: 10000,
    percentage: 0,
    status: 'normal'
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, quotaRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/quota'),
        fetch('/api/admin/activity')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (quotaRes.ok) {
        const quotaData = await quotaRes.json()
        setQuota(quotaData.quota)
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setRecentActivity(activityData.activities || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const getQuotaColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600'
    if (percentage < 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getQuotaVariant = (percentage: number) => {
    if (percentage < 50) return 'default'
    if (percentage < 80) return 'secondary'
    return 'destructive'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/')}>
                View Site
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="quota">Quota</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalVideos}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeVideos} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Channels</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalChannels}</div>
                  <p className="text-xs text-muted-foreground">
                    Whitelisted channels
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API Quota</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{quota.used}</div>
                  <p className="text-xs text-muted-foreground">
                    of {quota.total} units
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quota Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  API Quota Usage
                </CardTitle>
                <CardDescription>
                  Current YouTube API quota consumption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Usage</span>
                    <span className={`text-sm font-medium ${getQuotaColor(quota.percentage)}`}>
                      {quota.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={quota.percentage} className="h-2" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Used: {quota.used} units</span>
                    <span>Remaining: {quota.remaining} units</span>
                  </div>
                  {quota.percentage > 80 && (
                    <div className="flex items-center space-x-2 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>High quota usage - consider upgrading your plan</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Video Management</CardTitle>
                    <CardDescription>
                      Manage whitelisted videos and channels
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push('/admin/videos/add')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Video
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search videos..."
                      className="pl-10 pr-4 py-2 w-full border rounded-md"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="w-12 h-12 mx-auto mb-4" />
                  <p>No videos added yet</p>
                  <p className="text-sm">Click "Add Video" to get started</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quota" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Quota Management
                </CardTitle>
                <CardDescription>
                  Monitor and manage YouTube API quota usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{quota.used}</div>
                      <div className="text-sm text-muted-foreground">Used This Month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{quota.remaining}</div>
                      <div className="text-sm text-muted-foreground">Remaining</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{quota.total}</div>
                      <div className="text-sm text-muted-foreground">Total Quota</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Monthly Usage</span>
                      <Badge variant={getQuotaVariant(quota.percentage)}>
                        {quota.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={quota.percentage} className="h-3" />
                  </div>

                  {quota.status === 'critical' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-red-800">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">Critical Quota Usage</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        Your API quota usage is at {quota.percentage.toFixed(1)}%. Consider upgrading your plan or reducing usage.
                      </p>
                    </div>
                  )}

                  {quota.status === 'warning' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-yellow-800">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-medium">High Quota Usage</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your API quota usage is at {quota.percentage.toFixed(1)}%. Monitor your usage closely.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest system actions and audit logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4" />
                      <p>No recent activity</p>
                    </div>
                  ) : (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Activity className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{activity.action}</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.target_type}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.user?.email} • {new Date(activity.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}