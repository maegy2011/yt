'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  X, 
  EyeOff, 
  Shield, 
  Clock, 
  Activity,
  Lock,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useIncognito, useIncognitoStats } from '@/contexts/incognito-context'
import { cn } from '@/lib/utils'

export function IncognitoBannerEnhanced() {
  const { isIncognito, getIncognitoDuration, incognitoSessionId } = useIncognito()
  const { getIncognitoStats } = useIncognitoStats()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (isIncognito) {
      setIsDismissed(false)
    }
  }, [isIncognito])

  if (!isIncognito || isDismissed) {
    return null
  }

  const stats = getIncognitoStats()
  const privacyLevel = Math.min(100, (stats.videosWatched + stats.searchesMade) * 2)

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-destructive/5 via-destructive/10 to-destructive/5 border-b border-destructive/20 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-destructive animate-pulse" />
              <Badge variant="destructive" className="text-xs font-medium animate-pulse">
                INCOGNITO
              </Badge>
            </div>
            
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="font-mono">{stats.sessionDuration}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Protection Active</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <span>{stats.videosWatched} videos, {stats.searchesMade} searches</span>
              </div>
            </div>

            <div className="sm:hidden flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{stats.sessionDuration}</span>
              <Badge variant="outline" className="text-xs">
                {stats.videosWatched}V {stats.searchesMade}S
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2 text-xs"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {isExpanded ? 'Less' : 'More'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss incognito banner</span>
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="pb-3 border-t border-destructive/10 pt-3 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-background/50 rounded-lg border border-destructive/10">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Privacy Level</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Protection</span>
                    <span className="text-xs font-bold">{privacyLevel}%</span>
                  </div>
                  <Progress value={privacyLevel} className="h-1" />
                </div>
              </div>

              <div className="p-3 bg-background/50 rounded-lg border border-destructive/10">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Activity</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Videos:</span>
                    <span className="font-medium">{stats.videosWatched}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Searches:</span>
                    <span className="font-medium">{stats.searchesMade}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-background/50 rounded-lg border border-destructive/10">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Data Blocked</span>
                </div>
                <div className="text-lg font-bold text-destructive">
                  {stats.dataBlocked}
                </div>
              </div>

              <div className="p-3 bg-background/50 rounded-lg border border-destructive/10">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Session ID</span>
                </div>
                <div className="font-mono text-xs text-muted-foreground truncate">
                  {incognitoSessionId?.slice(-12)}...
                </div>
              </div>
            </div>

            <div className="mt-3 p-2 bg-destructive/5 rounded border border-destructive/10">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>
                  Your browsing activity, search history, and personal data are not being saved. 
                  Downloads and some site data may still be stored locally.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}