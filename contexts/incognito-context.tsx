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
  trackIncognitoActivity: (type: 'video' | 'search' | 'channel' | 'playlist', data?: any) => void
  getIncognitoHistory: () => IncognitoHistory
  exportIncognitoData: () => string
  resetIncognitoHistory: () => void
  updateIncognitoStats: (type: 'video' | 'search', increment?: number) => void
}

type IncognitoFeature = 'favorites' | 'notes' | 'watch-history' | 'search-history' | 'downloads' | 'subscriptions'

interface IncognitoStats {
  sessionDuration: string
  videosWatched: number
  searchesMade: number
  dataBlocked: string
  dataBlockedKB: number
  channelsVisited: number
  playlistsViewed: number
  favoritesBlocked: number
  notesBlocked: number
  watchHistoryBlocked: number
  searchHistoryBlocked: number
  sessionStartTime: Date | null
  lastActivity: Date | null
  averageSessionTime: string
  blockedFeatures: IncognitoFeature[]
}

interface IncognitoSession {
  id: string
  startTime: Date
  endTime?: Date
  stats: IncognitoStats
  isActive: boolean
}

interface IncognitoHistory {
  totalSessions: number
  totalTime: string
  totalDataBlocked: string
  averageSessionTime: string
  longestSession: string
  sessions: IncognitoSession[]
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
    dataBlocked: '0 KB',
    dataBlockedKB: 0,
    channelsVisited: 0,
    playlistsViewed: 0,
    favoritesBlocked: 0,
    notesBlocked: 0,
    watchHistoryBlocked: 0,
    searchHistoryBlocked: 0,
    sessionStartTime: null as Date | null,
    lastActivity: null as Date | null,
    averageSessionTime: '0:00',
    blockedFeatures: [] as IncognitoFeature[]
  })
  const [incognitoHistory, setIncognitoHistory] = useState<IncognitoHistory>({
    totalSessions: 0,
    totalTime: '0:00',
    totalDataBlocked: '0 KB',
    averageSessionTime: '0:00',
    longestSession: '0:00',
    sessions: []
  })

  // Load incognito state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('mytube-incognito')
      const savedStartTime = localStorage.getItem('mytube-incognito-start')
      
      if (savedState === 'true' && savedStartTime) {
        const savedSessionId = localStorage.getItem('mytube-incognito-session-id')
        const savedStats = localStorage.getItem('mytube-incognito-stats')
        const savedHistory = localStorage.getItem('mytube-incognito-history')
        
        setIsIncognito(true)
        setIncognitoStartTime(new Date(savedStartTime))
        setIncognitoSessionId(savedSessionId || `incognito-${Date.now()}`)
        
        if (savedStats) {
          try {
            const parsedStats = JSON.parse(savedStats)
            setIncognitoStats(prev => ({
              ...prev,
              ...parsedStats,
              sessionStartTime: new Date(savedStartTime),
              lastActivity: parsedStats.lastActivity ? new Date(parsedStats.lastActivity) : new Date()
            }))
          } catch (error) {
            // Console statement removed
          }
        }
        
        if (savedHistory) {
          try {
            const parsedHistory = JSON.parse(savedHistory)
            setIncognitoHistory(parsedHistory)
          } catch (error) {
            // Console statement removed
          }
        }
      }
    } catch (error) {
      // Console statement removed
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
        localStorage.setItem('mytube-incognito-history', JSON.stringify(incognitoHistory))
      } else {
        localStorage.removeItem('mytube-incognito')
        localStorage.removeItem('mytube-incognito-start')
        localStorage.removeItem('mytube-incognito-session-id')
        localStorage.removeItem('mytube-incognito-stats')
        // Keep history for analytics
      }
    } catch (error) {
      // Console statement removed
    }
  }, [isIncognito, incognitoStartTime, incognitoSessionId, incognitoStats, incognitoHistory])

  const enableIncognito = () => {
    const startTime = new Date()
    const sessionId = `incognito-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const newStats = {
      videosWatched: 0,
      searchesMade: 0,
      dataBlocked: '0 KB',
      dataBlockedKB: 0,
      channelsVisited: 0,
      playlistsViewed: 0,
      favoritesBlocked: 0,
      notesBlocked: 0,
      watchHistoryBlocked: 0,
      searchHistoryBlocked: 0,
      sessionStartTime: startTime,
      lastActivity: startTime,
      averageSessionTime: '0:00',
      blockedFeatures: ['favorites', 'notes', 'watch-history', 'search-history', 'subscriptions'] as IncognitoFeature[]
    }
    
    setIsIncognito(true)
    setIncognitoStartTime(startTime)
    setIncognitoSessionId(sessionId)
    setIncognitoStats(newStats)
    
    // Clear any sensitive data when entering incognito mode
    clearSensitiveData()
    
    // Console statement removed
  }

  const disableIncognito = () => {
    if (isIncognito && incognitoStartTime) {
      // Save current session to history
      const currentSession: IncognitoSession = {
        id: incognitoSessionId || 'unknown',
        startTime: incognitoStartTime,
        endTime: new Date(),
        stats: {
          ...incognitoStats,
          sessionDuration: getIncognitoDuration()
        },
        isActive: false
      }
      
      setIncognitoHistory(prev => {
        const updatedHistory = {
          ...prev,
          totalSessions: prev.totalSessions + 1,
          sessions: [...prev.sessions, currentSession].slice(-10) // Keep last 10 sessions
        }
        
        // Calculate updated statistics
        const totalSessionTime = updatedHistory.sessions.reduce((total, session) => {
          if (session.endTime) {
            const duration = session.endTime.getTime() - session.startTime.getTime()
            return total + duration
          }
          return total
        }, 0)
        
        const totalMinutes = Math.floor(totalSessionTime / 60000)
        const totalHours = Math.floor(totalMinutes / 60)
        const remainingMinutes = totalMinutes % 60
        
        updatedHistory.totalTime = totalHours > 0 
          ? `${totalHours}h ${remainingMinutes}m`
          : `${remainingMinutes}m`
        
        // Calculate total data blocked
        const totalDataKB = updatedHistory.sessions.reduce((total, session) => {
          return total + (session.stats.dataBlockedKB || 0)
        }, 0)
        
        updatedHistory.totalDataBlocked = totalDataKB > 1024 
          ? `${(totalDataKB / 1024).toFixed(1)} MB`
          : `${totalDataKB} KB`
        
        // Calculate average session time
        if (updatedHistory.totalSessions > 0) {
          const avgMinutes = Math.floor(totalSessionTime / (updatedHistory.totalSessions * 60000))
          const avgHours = Math.floor(avgMinutes / 60)
          const avgRemainingMinutes = avgMinutes % 60
          updatedHistory.averageSessionTime = avgHours > 0 
            ? `${avgHours}:${avgRemainingMinutes.toString().padStart(2, '0')}`
            : `0:${avgMinutes.toString().padStart(2, '0')}`
        }
        
        return updatedHistory
      })
    }
    
    setIsIncognito(false)
    setIncognitoStartTime(null)
    setIncognitoSessionId(null)
    setIncognitoStats({
      videosWatched: 0,
      searchesMade: 0,
      dataBlocked: '0 KB',
      dataBlockedKB: 0,
      channelsVisited: 0,
      playlistsViewed: 0,
      favoritesBlocked: 0,
      notesBlocked: 0,
      watchHistoryBlocked: 0,
      searchHistoryBlocked: 0,
      sessionStartTime: null,
      lastActivity: null,
      averageSessionTime: '0:00',
      blockedFeatures: []
    })
    
    // Clear all temporary data when exiting incognito mode
    clearIncognitoData()
    
    // Console statement removed
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
          // Console statement removed
        }
      })
    } catch (error) {
      // Console statement removed
    }
  }

  // Clear all incognito data when exiting incognito mode
  const clearIncognitoData = () => {
    try {
      // Clear session storage data
      try {
        sessionStorage.clear()
      } catch (error) {
        // Console statement removed
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
          // Console statement removed
        }
      })
    } catch (error) {
      // Console statement removed
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
      dataBlocked: incognitoStats.dataBlocked,
      dataBlockedKB: incognitoStats.dataBlockedKB,
      channelsVisited: incognitoStats.channelsVisited,
      playlistsViewed: incognitoStats.playlistsViewed,
      favoritesBlocked: incognitoStats.favoritesBlocked,
      notesBlocked: incognitoStats.notesBlocked,
      watchHistoryBlocked: incognitoStats.watchHistoryBlocked,
      searchHistoryBlocked: incognitoStats.searchHistoryBlocked,
      sessionStartTime: incognitoStats.sessionStartTime,
      lastActivity: incognitoStats.lastActivity,
      averageSessionTime: incognitoStats.averageSessionTime,
      blockedFeatures: incognitoStats.blockedFeatures
    }
  }

  const clearIncognitoSession = () => {
    setIncognitoStats({
      videosWatched: 0,
      searchesMade: 0,
      dataBlocked: '0 KB',
      dataBlockedKB: 0,
      channelsVisited: 0,
      playlistsViewed: 0,
      favoritesBlocked: 0,
      notesBlocked: 0,
      watchHistoryBlocked: 0,
      searchHistoryBlocked: 0,
      sessionStartTime: incognitoStats.sessionStartTime,
      lastActivity: new Date(),
      averageSessionTime: '0:00',
      blockedFeatures: incognitoStats.blockedFeatures
    })
    clearIncognitoData()
  }

  const trackIncognitoActivity = (type: 'video' | 'search' | 'channel' | 'playlist', data?: any) => {
    if (!isIncognito) return
    
    // Debounce rapid activity updates to improve performance
    setIncognitoStats(prev => {
      const newStats = { ...prev, lastActivity: new Date() }
      
      switch (type) {
        case 'video':
          newStats.videosWatched += 1
          break
        case 'search':
          newStats.searchesMade += 1
          break
        case 'channel':
          newStats.channelsVisited += 1
          break
        case 'playlist':
          newStats.playlistsViewed += 1
          break
      }
      
      // Enhanced data blocked calculation based on activity type
      let totalData = (newStats.videosWatched * 50) + (newStats.searchesMade * 2)
      totalData += (newStats.channelsVisited * 5) + (newStats.playlistsViewed * 10)
      
      newStats.dataBlockedKB = totalData
      newStats.dataBlocked = totalData > 1024 ? `${(totalData / 1024).toFixed(1)} MB` : `${totalData} KB`
      
      // Update blocked feature counters when user tries to use restricted features
      if (data?.attemptedFeature) {
        switch (data.attemptedFeature) {
          case 'favorites':
            newStats.favoritesBlocked += 1
            break
          case 'notes':
            newStats.notesBlocked += 1
            break
          case 'watch-history':
            newStats.watchHistoryBlocked += 1
            break
          case 'search-history':
            newStats.searchHistoryBlocked += 1
            break
        }
      }
      
      return newStats
    })
  }

  const getIncognitoHistory = (): IncognitoHistory => {
    return incognitoHistory
  }

  const exportIncognitoData = (): string => {
    const exportData = {
      currentSession: isIncognito ? {
        sessionId: incognitoSessionId,
        startTime: incognitoStartTime,
        stats: getIncognitoStats()
      } : null,
      history: incognitoHistory,
      exportDate: new Date().toISOString()
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  const resetIncognitoHistory = () => {
    setIncognitoHistory({
      totalSessions: 0,
      totalTime: '0:00',
      totalDataBlocked: '0 KB',
      averageSessionTime: '0:00',
      longestSession: '0:00',
      sessions: []
    })
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
      const totalData = (newStats.videosWatched * 50) + (newStats.searchesMade * 2) // KB
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
    isFeatureRestricted,
    trackIncognitoActivity,
    getIncognitoHistory,
    exportIncognitoData,
    resetIncognitoHistory,
    updateIncognitoStats
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
  const { 
    getIncognitoStats, 
    clearIncognitoSession, 
    trackIncognitoActivity,
    getIncognitoHistory,
    exportIncognitoData,
    resetIncognitoHistory,
    updateIncognitoStats
  } = useIncognito()
  
  return {
    getIncognitoStats,
    clearIncognitoSession,
    trackIncognitoActivity,
    getIncognitoHistory,
    exportIncognitoData,
    resetIncognitoHistory,
    updateIncognitoStats
  }
}