'use client'

import { useState, useEffect } from 'react'

interface AppSettings {
  blacklistWhitelistVisibility: 'always' | 'hover' | 'hidden'
}

const DEFAULT_SETTINGS: AppSettings = {
  blacklistWhitelistVisibility: 'always'
}

export function useBlacklistWhitelistVisibility() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    const savedSettings = localStorage.getItem('mytube-app-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({
          blacklistWhitelistVisibility: parsed.blacklistWhitelistVisibility || 'always'
        })
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
  }, [])

  const updateSetting = (key: keyof AppSettings, value: AppSettings[typeof key]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value }
      localStorage.setItem('mytube-app-settings', JSON.stringify(newSettings))
      return newSettings
    })
  }

  const shouldShowButtons = (isHovered: boolean = false) => {
    switch (settings.blacklistWhitelistVisibility) {
      case 'always':
        return true
      case 'hover':
        return isHovered
      case 'hidden':
        return false
      default:
        return true
    }
  }

  return {
    visibility: settings.blacklistWhitelistVisibility,
    shouldShowButtons,
    updateSetting
  }
}