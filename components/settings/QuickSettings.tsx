'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Sliders, 
  Palette, 
  Shield, 
  Play, 
  Database, 
  Zap,
  ChevronRight,
  Sun,
  Moon,
  Volume2,
  Wifi,
  HardDrive
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface QuickSettingsProps {
  className?: string
}

export function QuickSettings({ className }: QuickSettingsProps) {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    theme: 'system',
    volume: 70,
    autoPlay: true,
    dataSaver: false,
    notifications: true
  })

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    toast({
      title: "Setting Updated",
      description: `${key} has been updated.`,
      duration: 2000,
    })
  }

  const getThemeIcon = () => {
    switch (settings.theme) {
      case 'light': return <Sun className="h-4 w-4" />
      case 'dark': return <Moon className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const quickSettings = [
    {
      icon: getThemeIcon(),
      label: 'Theme',
      value: settings.theme,
      action: () => {
        const themes = ['light', 'dark', 'system']
        const currentIndex = themes.indexOf(settings.theme)
        const nextTheme = themes[(currentIndex + 1) % themes.length]
        updateSetting('theme', nextTheme)
      }
    },
    {
      icon: <Volume2 className="h-4 w-4" />,
      label: 'Volume',
      value: `${settings.volume}%`,
      action: () => {
        const newVolume = settings.volume >= 100 ? 0 : settings.volume + 10
        updateSetting('volume', newVolume)
      }
    },
    {
      icon: <Play className="h-4 w-4" />,
      label: 'Auto Play',
      value: settings.autoPlay ? 'On' : 'Off',
      action: () => updateSetting('autoPlay', !settings.autoPlay)
    },
    {
      icon: <Wifi className="h-4 w-4" />,
      label: 'Data Saver',
      value: settings.dataSaver ? 'On' : 'Off',
      action: () => updateSetting('dataSaver', !settings.dataSaver)
    }
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={className}
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Quick Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-3 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Quick Settings</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              Fast Access
            </Badge>
          </div>
        </div>

        {quickSettings.map((setting, index) => (
          <div key={setting.label}>
            <DropdownMenuItem onClick={setting.action} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {setting.icon}
                <span className="text-sm">{setting.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{setting.value}</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </DropdownMenuItem>
            {index < quickSettings.length - 1 && <DropdownMenuSeparator />}
          </div>
        ))}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="text-xs text-muted-foreground">
          <HardDrive className="h-3 w-3 mr-2" />
          Open Full Settings
          <ChevronRight className="h-3 w-3 ml-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface SettingsBadgeProps {
  setting: string
  value: string | boolean
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

export function SettingsBadge({ setting, value, icon: Icon, className }: SettingsBadgeProps) {
  return (
    <Badge variant="outline" className={className}>
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      <span className="text-xs">{setting}:</span>
      <span className="font-medium ml-1">{String(value)}</span>
    </Badge>
  )
}

interface SettingsStatusProps {
  className?: string
}

export function SettingsStatus({ className }: SettingsStatusProps) {
  const [settings, setSettings] = useState({
    theme: 'system',
    autoPlay: true,
    dataSaver: false,
    notifications: true
  })

  const statusItems = [
    { key: 'theme', label: 'Theme', value: settings.theme, icon: settings.theme === 'dark' ? Moon : Sun },
    { key: 'autoPlay', label: 'Auto Play', value: settings.autoPlay ? 'On' : 'Off', icon: Play },
    { key: 'dataSaver', label: 'Data Saver', value: settings.dataSaver ? 'On' : 'Off', icon: Wifi },
    { key: 'notifications', label: 'Notifications', value: settings.notifications ? 'On' : 'Off', icon: Shield }
  ]

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {statusItems.map((item) => (
        <SettingsBadge
          key={item.key}
          setting={item.label}
          value={item.value}
          icon={item.icon}
        />
      ))}
    </div>
  )
}