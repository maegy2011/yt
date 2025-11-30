'use client'

import { useState } from 'react'
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
  Zap
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
  
  const { getIncognitoStats, clearIncognitoSession } = useIncognitoStats()
  const { toast } = useToast()
  const [showEnableDialog, setShowEnableDialog] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [showStatsDialog, setShowStatsDialog] = useState(false)

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
    const totalActivity = stats.videosWatched + stats.searchesMade
    
    if (totalActivity > 50) return { level: 100, label: 'Maximum', color: 'bg-red-500' }
    if (totalActivity > 20) return { level: 75, label: 'High', color: 'bg-orange-500' }
    if (totalActivity > 5) return { level: 50, label: 'Medium', color: 'bg-yellow-500' }
    return { level: 25, label: 'Basic', color: 'bg-blue-500' }
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
                <Badge variant="destructive" className="ml-auto text-xs animate-pulse">
                  Active
                </Badge>
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
            </DropdownMenuItem>
            
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
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <strong>Session Summary:</strong><br />
                  Duration: {stats.sessionDuration}<br />
                  Videos watched: {stats.videosWatched}<br />
                  Searches made: {stats.searchesMade}<br />
                  Data blocked: {stats.dataBlocked}
                </div>
              </AlertDialogDescription>
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
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Incognito Session Statistics
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Session Duration</span>
                  </div>
                  <div className="text-2xl font-bold">{stats.sessionDuration}</div>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Privacy Level</span>
                  </div>
                  <div className="text-2xl font-bold">{privacy.level}%</div>
                  <div className="text-xs text-muted-foreground">{privacy.label}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 bg-muted/30 rounded">
                  <div className="text-xl font-bold">{stats.videosWatched}</div>
                  <div className="text-xs text-muted-foreground">Videos</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded">
                  <div className="text-xl font-bold">{stats.searchesMade}</div>
                  <div className="text-xs text-muted-foreground">Searches</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded">
                  <div className="text-xl font-bold">{stats.dataBlocked}</div>
                  <div className="text-xs text-muted-foreground">Blocked</div>
                </div>
              </div>

              <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
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
              <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                <li>Watch history</li>
                <li>Search history</li>
                <li>Favorites and notes</li>
                <li>Channel subscriptions</li>
              </ul>
              <div className="mt-3 p-2 bg-muted rounded text-xs">
                <strong>Note:</strong> Downloads and some site data may still be saved locally on your device.
              </div>
            </AlertDialogDescription>
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