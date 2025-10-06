'use client'

import { useState, useEffect } from 'react'

interface UserPreferences {
  lastWatchedChannel?: string
  theme?: 'light' | 'dark' | 'system'
  timeFilter?: 'all' | 'today' | 'week' | 'month' | 'year'
  volume?: number
  autoplay?: boolean
  videoQuality?: 'auto' | '1080p' | '720p' | '480p' | '360p'
}

const STORAGE_KEY = 'youtube-platform-preferences'

const defaultPreferences: UserPreferences = {
  theme: 'system',
  timeFilter: 'all',
  volume: 100,
  autoplay: false,
  videoQuality: 'auto'
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(true)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        // Validate stored data before parsing
        if (typeof stored !== 'string') {
          throw new Error('Invalid stored data type')
        }
        
        // Basic validation - check if it looks like JSON
        if (!stored.trim().startsWith('{') || !stored.trim().endsWith('}')) {
          throw new Error('Invalid JSON format')
        }
        
        const parsed = JSON.parse(stored)
        
        // Validate parsed data structure
        if (parsed && typeof parsed === 'object') {
          // Only allow known properties
          const safePreferences: Partial<UserPreferences> = {}
          
          if (parsed.theme && ['light', 'dark', 'system'].includes(parsed.theme)) {
            safePreferences.theme = parsed.theme
          }
          
          if (parsed.timeFilter && ['all', 'today', 'week', 'month', 'year'].includes(parsed.timeFilter)) {
            safePreferences.timeFilter = parsed.timeFilter
          }
          
          if (typeof parsed.volume === 'number' && parsed.volume >= 0 && parsed.volume <= 100) {
            safePreferences.volume = parsed.volume
          }
          
          if (typeof parsed.autoplay === 'boolean') {
            safePreferences.autoplay = parsed.autoplay
          }
          
          if (parsed.videoQuality && ['auto', '1080p', '720p', '480p', '360p'].includes(parsed.videoQuality)) {
            safePreferences.videoQuality = parsed.videoQuality
          }
          
          if (parsed.lastWatchedChannel && typeof parsed.lastWatchedChannel === 'string') {
            // Sanitize channel ID
            safePreferences.lastWatchedChannel = parsed.lastWatchedChannel
              .replace(/[<>\"']/g, '')
              .substring(0, 50)
              .trim()
          }
          
          setPreferences({ ...defaultPreferences, ...safePreferences })
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
      // Clear corrupted data
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (clearError) {
        console.error('Error clearing corrupted preferences:', clearError)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
      } catch (error) {
        console.error('Error saving preferences:', error)
      }
    }
  }, [preferences, isLoading])

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }))
  }

  const resetPreferences = () => {
    setPreferences(defaultPreferences)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error resetting preferences:', error)
    }
  }

  const clearPreferences = () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setPreferences(defaultPreferences)
    } catch (error) {
      console.error('Error clearing preferences:', error)
    }
  }

  return {
    preferences,
    isLoading,
    updatePreference,
    updatePreferences,
    resetPreferences,
    clearPreferences
  }
}