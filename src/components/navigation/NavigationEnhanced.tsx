'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Menu, 
  X, 
  Home, 
  Heart, 
  History, 
  Settings, 
  User,
  ChevronDown,
  Moon,
  Sun
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAccessibility, useAriaLive, a11y } from '@/hooks/useAccessibility'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface NavigationProps {
  onSearch?: (query: string) => void
  onMenuToggle?: () => void
  isMenuOpen?: boolean
  className?: string
}

export function NavigationEnhanced({ 
  onSearch, 
  onMenuToggle, 
  isMenuOpen = false,
  className = ''
}: NavigationProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activeItem, setActiveItem] = useState('home')
  const { theme, setTheme } = useTheme()
  const { announce } = useAriaLive()
  
  // Accessibility refs
  const navRef = useAccessibility({ trapFocus: false })
  const searchInputRef = useRef<HTMLInputElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  // Navigation items with accessibility labels
  const navItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: Home, 
      ariaLabel: 'Go to home page',
      shortcut: 'h'
    },
    { 
      id: 'favorites', 
      label: 'Favorites', 
      icon: Heart, 
      ariaLabel: 'View favorite videos',
      shortcut: 'f'
    },
    { 
      id: 'history', 
      label: 'History', 
      icon: History, 
      ariaLabel: 'View watch history',
      shortcut: 'r'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      ariaLabel: 'Go to settings',
      shortcut: 's'
    }
  ]

  // Handle search with accessibility announcement
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (onSearch) {
      onSearch(query)
      if (query.trim()) {
        announce(`Searching for ${query}`)
      }
    }
  }

  // Handle navigation item click
  const handleNavItemClick = (itemId: string, itemLabel: string) => {
    setActiveItem(itemId)
    announce(`Navigated to ${itemLabel}`)
    
    // Here you would typically handle navigation
    // Console statement removed
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const target = e.currentTarget as HTMLElement
      target.click()
    }
  }

  // Handle search input keyboard shortcuts
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSearch(searchQuery)
    }
    if (e.key === 'Escape') {
      setSearchQuery('')
      searchInputRef.current?.blur()
    }
  }

  // Toggle theme with announcement
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    announce(`Switched to ${newTheme} mode`)
  }

  // Handle menu toggle with accessibility
  const handleMenuToggle = () => {
    if (onMenuToggle) {
      onMenuToggle()
      announce(isMenuOpen ? 'Menu closed' : 'Menu opened')
    }
  }

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileOpen && !event.target || !(event.target as Element).closest('.profile-dropdown')) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isProfileOpen])

  return (
    <ErrorBoundary>
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <header 
        ref={navRef}
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40"
        role="banner"
      >
        <nav className="container mx-auto px-4 h-16 flex items-center gap-4" role="navigation" aria-label="Main navigation">
          {/* Mobile menu button */}
          <Button
            ref={menuButtonRef}
            variant="ghost"
            size="sm"
            onClick={handleMenuToggle}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            className="lg:hidden"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">YT</span>
            </div>
            <span className="font-semibold text-lg">YouTube Clone</span>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                aria-label="Search videos"
                className="pl-10 pr-4"
                role="searchbox"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    searchInputRef.current?.focus()
                  }}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="rounded-full"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Navigation items - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.id}
                  variant={activeItem === item.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleNavItemClick(item.id, item.label)}
                  onKeyDown={handleKeyDown}
                  aria-label={item.ariaLabel}
                  aria-current={activeItem === item.id ? 'page' : undefined}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {activeItem === item.id && (
                    <span className="sr-only">Current page</span>
                  )}
                </Button>
              )
            })}
          </div>

          {/* Profile dropdown */}
          <div className="relative profile-dropdown">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="User profile"
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
              className="gap-2"
            >
              <User className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>

            {isProfileOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-48 bg-background border rounded-md shadow-lg z-50"
                role="menu"
              >
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleNavItemClick('settings', 'Settings')
                      setIsProfileOpen(false)
                    }}
                    className="w-full justify-start gap-2"
                    role="menuitem"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t bg-background/95 backdrop-blur">
            <div className="container mx-auto px-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.id}
                      variant={activeItem === item.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        handleNavItemClick(item.id, item.label)
                        handleMenuToggle()
                      }}
                      onKeyDown={handleKeyDown}
                      aria-label={item.ariaLabel}
                      aria-current={activeItem === item.id ? 'page' : undefined}
                      className="gap-2 justify-start"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Keyboard shortcuts help */}
      <div className="sr-only" role="status" aria-live="polite">
        <p>Keyboard shortcuts available: Press H for Home, F for Favorites, R for History, S for Settings, / for search</p>
      </div>
    </ErrorBoundary>
  )
}