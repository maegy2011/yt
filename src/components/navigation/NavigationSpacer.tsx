'use client'

import { useNavigationHeight } from './BottomNavigation'

interface NavigationSpacerProps {
  className?: string
}

export function NavigationSpacer({ className = '' }: NavigationSpacerProps) {
  const navHeight = useNavigationHeight()
  
  return (
    <div 
      className={className}
      style={{ 
        height: `${navHeight}px`,
        minHeight: `${navHeight}px`
      }}
    />
  )
}