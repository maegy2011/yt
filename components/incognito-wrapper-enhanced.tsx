'use client'

import { ReactNode, useEffect } from 'react'
import { useIncognito, useIncognitoRestriction } from '@/contexts/incognito-context'
import { useToast } from '@/hooks/use-toast'
import { 
  Lock, 
  EyeOff, 
  AlertTriangle,
  Shield
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface IncognitoWrapperProps {
  children: ReactNode
  feature: 'favorites' | 'notes' | 'watch-history' | 'search-history' | 'subscriptions' | 'downloads'
  fallback?: ReactNode
  className?:string
}

export function IncognitoWrapper({ 
  children, 
  feature, 
  fallback, 
  className 
}: IncognitoWrapperProps) {
  const { isIncognito } = useIncognito()
  const { shouldDisableFeature, getIncognitoMessage } = useIncognitoRestriction()
  const { toast } = useToast()

  const isDisabled = shouldDisableFeature(feature)
  const message = getIncognitoMessage(feature)

  useEffect(() => {
    if (isDisabled) {
      const handleInteraction = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        
        toast({
          title: "Feature Restricted",
          description: message,
          duration: 2000,
        })
      }

      const element = document.getElementById(`incognito-restricted-${feature}`)
      if (element) {
        element.addEventListener('click', handleInteraction)
        element.addEventListener('touchstart', handleInteraction)
        
        return () => {
          element.removeEventListener('click', handleInteraction)
          element.removeEventListener('touchstart', handleInteraction)
        }
      }
    }
  }, [isDisabled, message, toast, feature])

  if (!isIncognito) {
    return <>{children}</>
  }

  if (isDisabled) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div 
        id={`incognito-restricted-${feature}`}
        className={cn(
          "relative group cursor-not-allowed opacity-60",
          "bg-gradient-to-r from-destructive/5 to-destructive/10",
          "border border-destructive/20 rounded-lg p-4",
          "transition-all duration-200 hover:from-destructive/10 hover:to-destructive/15",
          className
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg p-3 border border-destructive/30 shadow-lg">
            <div className="flex items-center gap-2 text-sm">
              <EyeOff className="h-4 w-4 text-destructive" />
              <span className="text-muted-foreground font-medium">
                {message}
              </span>
            </div>
          </div>
        </div>
        
        <div className="invisible">
          {children}
        </div>

        <div className="absolute top-2 right-2">
          <Badge variant="destructive" className="text-xs">
            <Lock className="h-3 w-3 mr-1" />
            Restricted
          </Badge>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

interface IncognitoOverlayProps {
  children: ReactNode
  showOverlay?: boolean
  message?: string
  className?: string
}

export function IncognitoOverlay({ 
  children, 
  showOverlay = false, 
  message = "This feature is limited in incognito mode",
  className 
}: IncognitoOverlayProps) {
  const { isIncognito } = useIncognito()

  if (!isIncognito || !showOverlay) {
    return <>{children}</>
  }

  return (
    <div className={cn("relative", className)}>
      {children}
      
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg border border-destructive/20 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-destructive" />
            <Badge variant="destructive" className="text-xs">
              INCOGNITO MODE
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {message}
          </p>
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            <span>Your activity is not being saved</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface IncognitoBadgeProps {
  feature?: string
  className?: string
}

export function IncognitoBadge({ feature, className }: IncognitoBadgeProps) {
  const { isIncognito } = useIncognito()

  if (!isIncognito) {
    return null
  }

  return (
    <Badge variant="destructive" className={cn("text-xs animate-pulse", className)}>
      <EyeOff className="h-3 w-3 mr-1" />
      Incognito
      {feature && ` - ${feature}`}
    </Badge>
  )
}

interface IncognitoStatusProps {
  className?: string
}

export function IncognitoStatus({ className }: IncognitoStatusProps) {
  const { isIncognito, getIncognitoDuration } = useIncognito()
  const { getIncognitoStats } = useIncognitoStats()

  if (!isIncognito) {
    return null
  }

  const stats = getIncognitoStats()

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <EyeOff className="h-3 w-3 text-destructive" />
      <span>Incognito mode active</span>
      <span>•</span>
      <span>{stats.sessionDuration}</span>
      <span>•</span>
      <span>{stats.videosWatched} videos</span>
    </div>
  )
}