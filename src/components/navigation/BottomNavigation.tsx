'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Search, 
  Play, 
  Clock, 
  Users, 
  Heart, 
  FileText,
  Settings,
  Menu,
  X
} from 'lucide-react'

type Tab = 'home' | 'search' | 'player' | 'channels' | 'favorites' | 'notes' | 'settings'

interface BottomNavigationProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  favoritesEnabled: boolean
  className?: string
}

interface NavItem {
  id: Tab
  icon: React.ComponentType<{ className?: string }>
  label: string
  showAlways?: boolean
}

export function BottomNavigation({ 
  activeTab, 
  onTabChange, 
  favoritesEnabled, 
  className = '' 
}: BottomNavigationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  // Handle scroll events to show/hide navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show/hide based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Calculate navigation height based on screen size - REDUCED HEIGHTS
  const getNavHeight = () => {
    const vh = window.innerHeight
    const vw = window.innerWidth
    
    // Reduced heights for smaller screen footprint
    if (vw < 640) { // sm breakpoint - mobile
      return Math.max(56, Math.min(64, vh * 0.06)) // 6% of viewport height, min 56px, max 64px
    } else if (vw < 768) { // md breakpoint - large mobile
      return Math.max(52, Math.min(60, vh * 0.055)) // 5.5% of viewport height, min 52px, max 60px
    } else if (vw < 1024) { // lg breakpoint - tablet
      return Math.max(48, Math.min(56, vh * 0.05)) // 5% of viewport height, min 48px, max 56px
    } else { // desktop
      return Math.max(40, Math.min(48, vh * 0.04)) // 4% of viewport height, min 40px, max 48px
    }
  }

  const navItems: NavItem[] = [
    { id: 'home', icon: Home, label: 'Home', showAlways: true },
    { id: 'search', icon: Search, label: 'Search', showAlways: true },
    { id: 'player', icon: Play, label: 'Player', showAlways: true },
    
    { id: 'channels', icon: Users, label: 'Channels', showAlways: true },
    { id: 'favorites', icon: Heart, label: 'Favorites', showAlways: false },
    { id: 'notes', icon: FileText, label: 'Notes', showAlways: true },
    { id: 'settings', icon: Settings, label: 'Settings', showAlways: true },
  ]

  // Filter items based on favorites enabled
  const visibleItems = navItems.filter(item => 
    item.showAlways || (item.id === 'favorites' ? favoritesEnabled : true)
  )

  const getContainerClasses = () => {
    const baseClasses = cn(
      'fixed bottom-0 left-0 right-0 z-50',
      'bg-background/95 backdrop-blur-lg border-t border-border',
      'transition-all duration-300 ease-in-out',
      'shadow-lg'
    )
    
    const visibilityClasses = isVisible ? 'translate-y-0' : 'translate-y-full'
    const heightClasses = `h-[${getNavHeight()}px]`
    
    return cn(baseClasses, visibilityClasses, heightClasses, className)
  }

  const getNavContentClasses = () => {
    const baseClasses = 'flex items-center justify-center h-full px-2 sm:px-4'
    
    if (isExpanded) {
      return cn(baseClasses, 'flex-col gap-1 py-2')
    }
    
    return cn(baseClasses, 'gap-1 sm:gap-2')
  }

  const getItemClasses = (isActive: boolean) => {
    const baseClasses = cn(
      'flex flex-col items-center justify-center',
      'transition-all duration-200 ease-in-out',
      'rounded-lg px-3 py-2 sm:px-3 sm:py-2',
      'min-w-[44px] sm:min-w-[44px] md:min-w-[44px] min-h-[44px] touch-manipulation', // Ensure 44px minimum
      'hover:bg-accent hover:text-accent-foreground',
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      'mobile-touch-feedback' // Add mobile touch feedback
    )
    
    const activeClasses = isActive 
      ? 'bg-primary text-primary-foreground shadow-sm' 
      : 'text-muted-foreground hover:text-foreground'
    
    return cn(baseClasses, activeClasses)
  }

  const getIconClasses = (isActive: boolean) => {
    const baseClasses = 'transition-all duration-200'
    const sizeClasses = isExpanded 
      ? 'w-5 h-5 sm:w-6 sm:h-6' 
      : 'w-5 h-5 sm:w-5 sm:h-5' // Consistent icon sizes
    
    return cn(baseClasses, sizeClasses, isActive ? 'scale-110' : 'scale-100')
  }

  const getLabelClasses = (isActive: boolean) => {
    const baseClasses = 'font-medium transition-all duration-200'
    const sizeClasses = isExpanded 
      ? 'text-xs sm:text-sm' 
      : 'text-xs sm:text-xs' // Increased font sizes
    
    return cn(baseClasses, sizeClasses, isActive ? 'opacity-100' : 'opacity-80')
  }

  return (
    <nav className={getContainerClasses()}>
      <div className={getNavContentClasses()}>
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={getItemClasses(isActive)}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={getIconClasses(isActive)} />
              <span className={getLabelClasses(isActive)}>
                {item.label}
              </span>
              {item.id === 'favorites' && favoritesEnabled && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 w-1.5 h-1.5 p-0 bg-red-500 border-red-500" // Smaller badge
                />
              )}
            </Button>
          )
        })}
        
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation mobile-touch-feedback"
          aria-label={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
        >
          {isExpanded ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </Button>
      </div>
    </nav>
  )
}

// Hook for responsive navigation height
export function useNavigationHeight() {
  const [navHeight, setNavHeight] = useState(56) // Default to smaller height

  useEffect(() => {
    const updateNavHeight = () => {
      const vh = window.innerHeight
      const vw = window.innerWidth
      
      let height: number
      if (vw < 640) {
        height = Math.max(56, Math.min(64, vh * 0.06)) // Mobile: 6%
      } else if (vw < 768) {
        height = Math.max(52, Math.min(60, vh * 0.055)) // Large mobile: 5.5%
      } else if (vw < 1024) {
        height = Math.max(48, Math.min(56, vh * 0.05)) // Tablet: 5%
      } else {
        height = Math.max(40, Math.min(48, vh * 0.04)) // Desktop: 4%
      }
      
      setNavHeight(height)
    }

    updateNavHeight()
    window.addEventListener('resize', updateNavHeight)
    return () => window.removeEventListener('resize', updateNavHeight)
  }, [])

  return navHeight
}