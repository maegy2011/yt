'use client'

import { useIncognitoRestriction } from '@/contexts/incognito-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EyeOff, Lock } from 'lucide-react'
import { ReactNode } from 'react'

interface IncognitoWrapperProps {
  children: ReactNode
  feature: 'favorites' | 'notes' | 'watch-history' | 'search-history'
  fallback?: ReactNode
  showMessage?: boolean
  className?: string
}

export function IncognitoWrapper({ 
  children, 
  feature, 
  fallback, 
  showMessage = true,
  className = '' 
}: IncognitoWrapperProps) {
  const { shouldDisableFeature, getIncognitoMessage } = useIncognitoRestriction()
  const isDisabled = shouldDisableFeature(feature)
  const message = getIncognitoMessage(feature)

  if (isDisabled) {
    if (fallback) {
      return <div className={className}>{fallback}</div>
    }

    return (
      <div className={`relative ${className}`}>
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        
        {showMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
            <div className="text-center p-4">
              <EyeOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-medium mb-1">
                {message}
              </p>
              <Badge variant="secondary" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Incognito Mode
              </Badge>
            </div>
          </div>
        )}
      </div>
    )
  }

  return <div className={className}>{children}</div>
}

// Hook for easily disabling buttons in incognito mode
export function useIncognitoButtonProps(feature: 'favorites' | 'notes' | 'watch-history' | 'search-history') {
  const { shouldDisableFeature, getIncognitoMessage } = useIncognitoRestriction()
  const isDisabled = shouldDisableFeature(feature)
  const message = getIncognitoMessage(feature)

  return {
    disabled: isDisabled,
    title: isDisabled ? message : undefined,
    onClick: isDisabled ? (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      // Optionally show a toast or notification
      // Console statement removed
    } : undefined
  }
}