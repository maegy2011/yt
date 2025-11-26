'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface IncognitoContextType {
  isIncognito: boolean
  enableIncognito: () => void
  disableIncognito: () => void
  toggleIncognito: () => void
  incognitoStartTime: Date | null
  getIncognitoDuration: () => string
  incognitoSessionId: string | null
  getIncognitoStats: () => IncognitoStats
  clearIncognitoSession: () => void
  isFeatureRestricted: (feature: IncognitoFeature) => boolean
}

type IncognitoFeature = 'favorites' | 'notes' | 'watch-history' | 'search-history' | 'downloads' | 'subscriptions'

interface IncognitoStats {
  sessionDuration: string
  videosWatched: number
  searchesMade: number
  dataBlocked: string
}

const IncognitoContext = createContext<IncognitoContextType | undefined>(undefined)

interface IncognitoProviderProps {
  children: ReactNode
}

export function IncognitoProvider({ children }: IncognitoProviderProps) {
  const [isIncognito, setIsIncognito] = useState(false)
  const [incognitoStartTime, setIncognitoStartTime] = useState<Date | null>(null)
  const [incognitoSessionId, setIncognitoSessionId] = useState<string | null>(null)
  const [incognitoStats, setIncognitoStats] = useState({
    videosWatched: 0,
    searchesMade: 0,
    dataBlocked: '0 KB'
  })

  // Load incognito state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('mytube-incognito')
      const savedStartTime = localStorage.getItem('mytube-incognito-start')
      
      if (savedState === 'true' && savedStartTime) {
        const savedSessionId = localStorage.getItem('mytube-incognito-session-id')
        const savedStats = localStorage.getItem('mytube-incognito-stats')
        
        setIsIncognito(true)
        setIncognitoStartTime(new Date(savedStartTime))
        setIncognitoSessionId(savedSessionId || `incognito-${Date.now()}`)
        
        if (savedStats) {
          try {
            setIncognitoStats(JSON.parse(savedStats))
          } catch (error) {
            console.warn('Failed to parse incognito stats:', error)
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load incognito state from localStorage:', error)
    }
  }, [])

  // Save incognito state to localStorage whenever it changes
  useEffect(() => {
    try {
      if (isIncognito) {
        localStorage.setItem('mytube-incognito', 'true')
        if (incognitoStartTime) {
          localStorage.setItem('mytube-incognito-start', incognitoStartTime.toISOString())
        }
        if (incognitoSessionId) {
          localStorage.setItem('mytube-incognito-session-id', incognitoSessionId)
        }
        localStorage.setItem('mytube-incognito-stats', JSON.stringify(incognitoStats))
      } else {
        localStorage.removeItem('mytube-incognito')
        localStorage.removeItem('mytube-incognito-start')
        localStorage.removeItem('mytube-incognito-session-id')
        localStorage.removeItem('mytube-incognito-stats')
      }
    } catch (error) {
      console.warn('Failed to save incognito state to localStorage:', error)
    }
  }, [isIncognito, incognitoStartTime, incognitoSessionId, incognitoStats])

  const enableIncognito = () => {
    const startTime = new Date()
    const sessionId = `incognito-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    setIsIncognito(true)
    setIncognitoStartTime(startTime)
    setIncognitoSessionId(sessionId)
    setIncognitoStats({
      videosWatched: 0,
      searchesMade: 0,
      dataBlocked: '0 KB'
    })
    
    // Clear any sensitive data when entering incognito mode
    clearSensitiveData()
    
    console.log('Incognito mode enabled at:', startTime, 'Session ID:', sessionId)
  }

  const disableIncognito = () => {
    setIsIncognito(false)
    setIncognitoStartTime(null)
    setIncognitoSessionId(null)
    setIncognitoStats({
      videosWatched: 0,
      searchesMade: 0,
      dataBlocked: '0 KB'
    })
    
    // Clear all temporary data when exiting incognito mode
    clearIncognitoData()
    
    console.log('Incognito mode disabled')
  }

  const toggleIncognito = () => {
    if (isIncognito) {
      disableIncognito()
    } else {
      enableIncognito()
    }
  }

  const getIncognitoDuration = (): string => {
    if (!incognitoStartTime) return '0:00'
    
    const now = new Date()
    const diff = now.getTime() - incognitoStartTime.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}:${remainingMinutes.toString().padStart(2, '0')}`
    }
    return `0:${minutes.toString().padStart(2, '0')}`
  }

  // Clear sensitive data when entering incognito mode
  const clearSensitiveData = () => {
    try {
      // Clear search cache
      const keysToRemove = [
        'mytube-search-cache',
        'mytube-recent-searches',
        'mytube-navigation-history',
        'mytube-user-preferences'
      ]
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn(`Failed to remove ${key}:`, error)
        }
      })
    } catch (error) {
      console.warn('Failed to clear sensitive data:', error)
    }
  }

  // Clear all incognito data when exiting incognito mode
  const clearIncognitoData = () => {
    try {
      // Clear session storage data
      try {
        sessionStorage.clear()
      } catch (error) {
        console.warn('Failed to clear sessionStorage:', error)
      }
      
      // Clear any incognito-specific localStorage items
      const incognitoKeys = [
        'mytube-incognito-temp-favorites',
        'mytube-incognito-temp-notes',
        'mytube-incognito-temp-watch-history'
      ]
      
      incognitoKeys.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn(`Failed to remove ${key}:`, error)
        }
      })
    } catch (error) {
      console.warn('Failed to clear incognito data:', error)
    }
  }

  // Warn user before closing window if in incognito mode
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isIncognito) {
        const message = 'You are in incognito mode. Your session data will be lost if you close this window.'
        e.returnValue = message
        return message
      }
    }

    if (isIncognito) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isIncognito])

  const getIncognitoStats = (): IncognitoStats => {
    return {
      sessionDuration: getIncognitoDuration(),
      videosWatched: incognitoStats.videosWatched,
      searchesMade: incognitoStats.searchesMade,
      dataBlocked: incognitoStats.dataBlocked
    }
  }

  const clearIncognitoSession = () => {
    setIncognitoStats({
      videosWatched: 0,
      searchesMade: 0,
      dataBlocked: '0 KB'
    })
    clearIncognitoData()
  }

  const isFeatureRestricted = (feature: IncognitoFeature): boolean => {
    if (!isIncognito) return false
    
    const restrictedFeatures: IncognitoFeature[] = [
      'favorites', 'notes', 'watch-history', 'search-history', 'subscriptions'
    ]
    
    return restrictedFeatures.includes(feature)
  }

  const updateIncognitoStats = (type: 'video' | 'search', increment: number = 1) => {
    if (!isIncognito) return
    
    setIncognitoStats(prev => {
      const newStats = { ...prev }
      if (type === 'video') {
        newStats.videosWatched += increment
      } else if (type === 'search') {
        newStats.searchesMade += increment
      }
      
      // Estimate data blocked (rough calculation)
      const totalData = (newStats.videosWatched * 50 + newStats.searchesMade * 2) // KB
      newStats.dataBlocked = totalData > 1024 ? `${(totalData / 1024).toFixed(1)} MB` : `${totalData} KB`
      
      return newStats
    })
  }

  const value: IncognitoContextType = {
    isIncognito,
    enableIncognito,
    disableIncognito,
    toggleIncognito,
    incognitoStartTime,
    getIncognitoDuration,
    incognitoSessionId,
    getIncognitoStats,
    clearIncognitoSession,
    isFeatureRestricted
  }

  return (
    <IncognitoContext.Provider value={value}>
      {children}
    </IncognitoContext.Provider>
  )
}

export function useIncognito() {
  const context = useContext(IncognitoContext)
  if (context === undefined) {
    throw new Error('useIncognito must be used within an IncognitoProvider')
  }
  return context
}

// Helper hook for components to check if they should be disabled in incognito mode
export function useIncognitoRestriction() {
  const { isIncognito, isFeatureRestricted } = useIncognito()
  
  return {
    isIncognito,
    shouldDisableFeature: isFeatureRestricted,
    getIncognitoMessage: (feature: IncognitoFeature) => {
      if (!isIncognito) return null
      
      switch (feature) {
        case 'favorites':
          return 'Favorites are disabled in incognito mode'
        case 'notes':
          return 'Notes are disabled in incognito mode'
        case 'watch-history':
          return 'Watch history is not saved in incognito mode'
        case 'search-history':
          return 'Search history is not saved in incognito mode'
        case 'subscriptions':
          return 'Subscriptions are disabled in incognito mode'
        case 'downloads':
          return 'Downloads work normally in incognito mode'
        default:
          return 'This feature is disabled in incognito mode'
      }
    }
  }
}

// Export hook for tracking incognito stats
export function useIncognitoStats() {
  const { getIncognitoStats, updateIncognitoStats, clearIncognitoSession } = useIncognito()
  
  return {
    getIncognitoStats,
    updateIncognitoStats,
    clearIncognitoSession
  }
}