'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Eye, 
  EyeOff, 
  Shield, 
  Clock, 
  Trash2,
  Info,
  CheckCircle,
  BarChart3,
  Activity,
  Lock,
  Unlock,
  Zap,
  Keyboard
} from 'lucide-react'
import { useIncognito, useIncognitoStats } from '@/contexts/incognito-context'
import { useToast } from '@/hooks/use-toast'

export function IncognitoToggleEnhanced() {
  const { 
    isIncognito, 
    enableIncognito, 
    disableIncognito, 
    getIncognitoDuration,
    incognitoSessionId,
    isFeatureRestricted
  } = useIncognito()
  
  const { 
    getIncognitoStats, 
    clearIncognitoSession,
    trackIncognitoActivity,
    getIncognitoHistory,
    exportIncognitoData,
    resetIncognitoHistory
  } = useIncognitoStats()
  const { toast } = useToast()
  const [showEnableDialog, setShowEnableDialog] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)

  const handleEnableIncognito = () => {
    enableIncognito()
    setShowEnableDialog(false)
    toast({
      title: "🔒 Incognito mode enabled",
      description: "Your browsing activity won't be saved",
      duration: 3000,
    })
  }

  const handleDisableIncognito = () => {
    disableIncognito()
    setShowDisableDialog(false)
    toast({
      title: "🔓 Incognito mode disabled",
      description: "Your browsing activity will be saved again",
      duration: 3000,
    })
  }

  const handleClearSession = () => {
    clearIncognitoSession()
    setShowStatsDialog(false)
    toast({
      title: "Session cleared",
      description: "Incognito session data has been reset",
      duration: 2000,
    })
  }

  const handleExportData = () => {
    try {
      const exportData = exportIncognitoData()
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `incognito-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setShowExportDialog(false)
      toast({
        title: "Data exported",
        description: "Incognito data has been downloaded",
        duration: 3000,
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export incognito data",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // Enhanced keyboard shortcuts for incognito actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isIncognito) return
      
      // Ctrl/Cmd + Shift + I for quick stats
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        setShowStatsDialog(true)
      }
      
      // Ctrl/Cmd + Shift + H for history
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault()
        setShowHistoryDialog(true)
      }
      
      // Ctrl/Cmd + Shift + E for export
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault()
        setShowExportDialog(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isIncognito, setShowStatsDialog, setShowHistoryDialog, setShowExportDialog])

  const handleResetHistory = () => {
    resetIncognitoHistory()
    setShowHistoryDialog(false)
    toast({
      title: "History reset",
      description: "Incognito history has been cleared",
      duration: 2000,
    })
  }

  const getIcon = () => {
    return isIncognito ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
  }

  const getLabel = () => {
    return isIncognito ? "Incognito" : "Normal"
  }

  const getBadgeVariant = () => {
    return isIncognito ? "destructive" : "secondary"
  }

  const getStats = () => {
    return getIncognitoStats()
  }

  const getPrivacyLevel = () => {
    if (!isIncognito) return { level: 0, label: 'Standard', color: 'bg-green-500' }
    
    const stats = getStats()
    const totalActivity = stats.videosWatched + stats.searchesMade + stats.channelsVisited + stats.playlistsViewed
    const blockedFeatures = stats.blockedFeatures?.length || 0
    
    // Enhanced privacy level calculation based on activity and blocked features
    if (totalActivity > 100 && blockedFeatures >= 5) return { level: 100, label: 'Maximum', color: 'bg-red-500' }
    if (totalActivity > 50 && blockedFeatures >= 4) return { level: 85, label: 'Ultra High', color: 'bg-red-400' }
    if (totalActivity > 25 && blockedFeatures >= 3) return { level: 70, label: 'High', color: 'bg-orange-500' }
    if (totalActivity > 10 && blockedFeatures >= 2) return { level: 50, label: 'Medium', color: 'bg-yellow-500' }
    if (totalActivity > 5 || blockedFeatures >= 1) return { level: 30, label: 'Basic', color: 'bg-blue-500' }
    return { level: 15, label: 'Minimal', color: 'bg-gray-500' }
  }

  const privacy = getPrivacyLevel()

  if (isIncognito) {
    const stats = getStats()
    
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-9 px-0 relative group hover:bg-destructive/10"
            >
              {getIcon()}
              <span className="sr-only">Toggle incognito mode</span>
              <Badge 
                variant={getBadgeVariant()} 
                className="absolute -top-1 -right-1 w-2 h-2 p-0 animate-pulse"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-4 border-b bg-gradient-to-r from-destructive/5 to-destructive/10">
              <div className="flex items-center gap-2 mb-3">
                <EyeOff className="h-4 w-4 text-destructive" />
                <span className="font-medium text-sm">Incognito Mode</span>
                <div className="flex items-center gap-2 ml-auto">
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    Active
                  </Badge>
                  <Badge variant="outline" className="text-xs px-2 py-0">
                    {privacy.label}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-mono font-medium">{stats.sessionDuration}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Privacy:</span>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {privacy.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Session ID:</span>
                  <span className="font-mono text-xs truncate max-w-24">
                    {incognitoSessionId?.slice(-8)}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Protection Level</span>
                  <span className="text-xs font-medium">{privacy.level}%</span>
                </div>
                <Progress value={privacy.level} className="h-1" />
              </div>
            </div>
            
            <div className="px-3 py-2 border-b">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Session Statistics</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="font-bold text-sm">{stats.videosWatched}</div>
                  <div className="text-muted-foreground">Videos</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="font-bold text-sm">{stats.searchesMade}</div>
                  <div className="text-muted-foreground">Searches</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="font-bold text-sm">{stats.dataBlocked}</div>
                  <div className="text-muted-foreground">Blocked</div>
                </div>
              </div>
            </div>
            
            <DropdownMenuItem onClick={() => setShowStatsDialog(true)}>
              <Activity className="h-4 w-4 mr-2" />
              View Detailed Stats
              <div className="ml-auto flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  {(() => {
                    const stats = getStats()
                    const totalActivity = stats.videosWatched + stats.searchesMade + stats.channelsVisited + stats.playlistsViewed
                    return totalActivity > 0 && (
                      totalActivity
                    )
                  })()}
                </Badge>
                <Keyboard className="h-3 w-3 text-muted-foreground" />
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setShowHistoryDialog(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Session History
              <div className="ml-auto flex items-center gap-1">
                <Badge variant="outline" className="text-xs">
                  {(() => {
                    const history = getIncognitoHistory()
                    return history.totalSessions
                  })()}
                </Badge>
                <Keyboard className="h-3 w-3 text-muted-foreground" />
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
              <Info className="h-4 w-4 mr-2" />
              Export Data
              <div className="ml-auto flex items-center gap-1">
                <Keyboard className="h-3 w-3 text-muted-foreground" />
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => setShowDisableDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Unlock className="h-4 w-4 mr-2" />
              Exit Incognito Mode
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              <Info className="h-3 w-3 mr-2" />
              Restricted features in incognito:
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
              {isFeatureRestricted('favorites') && '• Favorites'}
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
              {isFeatureRestricted('notes') && '• Notes'}
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
              {isFeatureRestricted('watch-history') && '• Watch History'}
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
              {isFeatureRestricted('search-history') && '• Search History'}
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
              {isFeatureRestricted('subscriptions') && '• Subscriptions'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Unlock className="h-5 w-5" />
                Exit Incognito Mode?
              </AlertDialogTitle>
              <AlertDialogDescription>
                All your incognito session data will be permanently deleted. Your browsing activity will start being saved again.
              </AlertDialogDescription>
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <strong>Session Summary:</strong><br />
                Duration: {stats.sessionDuration}<br />
                Videos watched: {stats.videosWatched}<br />
                Searches made: {stats.searchesMade}<br />
                Data blocked: {stats.dataBlocked}
              </div>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Stay Incognito</AlertDialogCancel>
              <AlertDialogAction onClick={handleDisableIncognito}>
                Exit Incognito
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
          <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Enhanced Incognito Statistics
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-6">
              {/* Primary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Session Duration</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.sessionDuration}</div>
                  {stats.lastActivity && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Last activity: {stats.lastActivity.toLocaleTimeString()}
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Privacy Level</span>
                  </div>
                  <div className="text-2xl font-bold">{privacy.level}%</div>
                  <div className="text-xs text-muted-foreground">{privacy.label}</div>
                </div>
              </div>
              
              {/* Activity Stats */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity Overview
                  <Badge variant="outline" className="text-xs">
                    Live
                  </Badge>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="text-xl font-bold text-primary">{stats.videosWatched}</div>
                    <div className="text-xs text-muted-foreground">Videos</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="text-xl font-bold text-primary">{stats.searchesMade}</div>
                    <div className="text-xs text-muted-foreground">Searches</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="text-xl font-bold text-primary">{stats.channelsVisited}</div>
                    <div className="text-xs text-muted-foreground">Channels</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="text-xl font-bold text-primary">{stats.playlistsViewed}</div>
                    <div className="text-xs text-muted-foreground">Playlists</div>
                  </div>
                </div>
              </div>

              {/* Privacy Protection Stats */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy Protection
                  <div className="flex items-center gap-1 ml-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-destructive/10 border border-destructive/20 rounded-lg hover:bg-destructive/15 transition-colors">
                    <div className="text-xl font-bold text-destructive">{stats.dataBlocked}</div>
                    <div className="text-xs text-muted-foreground">Data Blocked</div>
                    <div className="text-xs text-destructive/70 mt-1">
                      {stats.dataBlockedKB > 1024 ? 'High Protection' : 'Standard Protection'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="text-xl font-bold text-primary">{stats.favoritesBlocked}</div>
                    <div className="text-xs text-muted-foreground">Favorites Blocked</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {stats.favoritesBlocked > 0 ? 'Active' : 'None'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="text-xl font-bold text-primary">{stats.notesBlocked}</div>
                    <div className="text-xs text-muted-foreground">Notes Blocked</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {stats.notesBlocked > 0 ? 'Active' : 'None'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Session ID */}
              <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Session ID</span>
                </div>
                <div className="font-mono text-xs text-muted-foreground break-all">
                  {incognitoSessionId}
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearSession}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Session
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Session History Dialog */}
        <AlertDialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Incognito Session History
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-4">
              {(() => {
                const history = getIncognitoHistory()
                if (history.totalSessions === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No incognito sessions yet</p>
                    </div>
                  )
                }

                return (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold">{history.totalSessions}</div>
                        <div className="text-xs text-muted-foreground">Total Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{history.totalTime}</div>
                        <div className="text-xs text-muted-foreground">Total Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{history.totalDataBlocked}</div>
                        <div className="text-xs text-muted-foreground">Data Blocked</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{history.averageSessionTime}</div>
                        <div className="text-xs text-muted-foreground">Avg Session</div>
                      </div>
                    </div>

                    {/* Session List */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Recent Sessions</h3>
                      {history.sessions.slice().reverse().map((session, index) => (
                        <div key={session.id} className="p-3 bg-muted/20 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium">
                              Session #{history.totalSessions - index}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {session.startTime.toLocaleDateString()}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Duration:</span> {session.stats.sessionDuration}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Videos:</span> {session.stats.videosWatched}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Data:</span> {session.stats.dataBlocked}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetHistory} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Reset History
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Export Data Dialog */}
        <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Export Incognito Data
              </AlertDialogTitle>
              <AlertDialogDescription>
                Export your incognito session data and history for your records. This will create a JSON file with all your incognito statistics.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Export includes:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Current session statistics</li>
                  <li>• Session history (last 10 sessions)</li>
                  <li>• Privacy protection metrics</li>
                  <li>• Activity overview</li>
                  <li>• Export timestamp</li>
                </ul>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-xs text-blue-800 dark:text-blue-200">
                    Your data is exported locally and never shared with any servers. The exported file is for your personal records only.
                  </div>
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleExportData}>
                <Info className="h-4 w-4 mr-2" />
                Export Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 px-0 hover:bg-primary/10">
            {getIcon()}
            <span className="sr-only">Toggle incognito mode</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <div className="px-3 py-3 border-b bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4" />
              <span className="font-medium text-sm">Normal Mode</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                Active
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>All features enabled</span>
              </div>
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Browsing activity is saved</span>
              </div>
            </div>
          </div>
          
          <DropdownMenuItem onClick={() => setShowEnableDialog(true)} className="font-medium">
            <EyeOff className="h-4 w-4 mr-2" />
            Enable Incognito Mode
            <Badge variant="outline" className="ml-auto text-xs">
              New
            </Badge>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            <Info className="h-3 w-3 mr-2" />
            Incognito mode prevents saving:
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
            • Watch history
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
            • Search history
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
            • Favorites and notes
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
            • Channel subscriptions
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <EyeOff className="h-5 w-5" />
              Enable Incognito Mode?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your browsing activity won't be saved to your account. This includes:
            </AlertDialogDescription>
            <ul className="mt-2 text-sm list-disc list-inside space-y-1 px-6">
              <li>Watch history</li>
              <li>Search history</li>
              <li>Favorites and notes</li>
              <li>Channel subscriptions</li>
            </ul>
            <div className="mt-3 p-2 bg-muted rounded text-xs">
              <strong>Note:</strong> Downloads and some site data may still be saved locally on your device.
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnableIncognito}>
              <Shield className="h-4 w-4 mr-2" />
              Enable Incognito
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}