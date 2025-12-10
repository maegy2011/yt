'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Keyboard, 
  Eye, 
  Volume2, 
  MousePointer,
  Check,
  X,
  Info
} from 'lucide-react'
import { useAccessibility, useAriaLive } from '@/hooks/useAccessibility'

interface AccessibilityGuideProps {
  className?: string
}

export function AccessibilityGuide({ className = '' }: AccessibilityGuideProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { announce } = useAriaLive()

  const keyboardShortcuts = [
    { key: 'H', description: 'Navigate to Home', category: 'navigation' },
    { key: 'F', description: 'Navigate to Favorites', category: 'navigation' },
    { key: 'R', description: 'Navigate to History', category: 'navigation' },
    { key: 'S', description: 'Navigate to Settings', category: 'navigation' },
    { key: '/', description: 'Focus search input', category: 'search' },
    { key: 'Escape', description: 'Clear search or close modal', category: 'general' },
    { key: 'Tab', description: 'Navigate between focusable elements', category: 'navigation' },
    { key: 'Shift+Tab', description: 'Navigate backwards', category: 'navigation' },
    { key: 'Enter/Space', description: 'Activate buttons and links', category: 'general' },
    { key: 'Arrow Keys', description: 'Navigate within lists and menus', category: 'navigation' }
  ]

  const screenReaderFeatures = [
    { feature: 'ARIA Labels', description: 'All interactive elements have descriptive labels' },
    { feature: 'Live Regions', description: 'Dynamic content changes are announced' },
    { feature: 'Page Structure', description: 'Semantic HTML5 elements for proper page structure' },
    { feature: 'Skip Links', description: 'Skip to main content links available' },
    { feature: 'Focus Management', description: 'Proper focus handling in modals and dynamic content' },
    { feature: 'Error Announcements', description: 'Form errors and loading states are announced' }
  ]

  const visualFeatures = [
    { feature: 'High Contrast', description: 'Supports high contrast mode preferences' },
    { feature: 'Reduced Motion', description: 'Respects prefers-reduced-motion setting' },
    { feature: 'Focus Indicators', description: 'Clear focus indicators for keyboard navigation' },
    { feature: 'Text Scaling', description: 'Text scales properly up to 200%' },
    { feature: 'Color Independence', description: 'Information not conveyed by color alone' },
    { feature: 'Responsive Design', description: 'Works with screen magnifiers and zoom' }
  ]

  const testAccessibility = (feature: string) => {
    announce(`Testing ${feature} accessibility feature`)
    // Here you could trigger actual accessibility tests
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Accessibility Guide</h1>
        <p className="text-muted-foreground">
          Learn about the accessibility features available in this application
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Info className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="keyboard" className="gap-2">
            <Keyboard className="h-4 w-4" />
            Keyboard
          </TabsTrigger>
          <TabsTrigger value="screen-reader" className="gap-2">
            <Volume2 className="h-4 w-4" />
            Screen Reader
          </TabsTrigger>
          <TabsTrigger value="visual" className="gap-2">
            <Eye className="h-4 w-4" />
            Visual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                WCAG 2.1 Compliance
              </CardTitle>
              <CardDescription>
                This application follows Web Content Accessibility Guidelines (WCAG) 2.1 AA standards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">✅ Perceivable</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Text alternatives for images</li>
                    <li>• Captions for video content</li>
                    <li>• High contrast support</li>
                    <li>• Responsive text sizing</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">✅ Operable</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Full keyboard navigation</li>
                    <li>• No time limits on interactions</li>
                    <li>• No flashing content</li>
                    <li>• Clear focus indicators</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">✅ Understandable</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Predictable navigation</li>
                    <li>• Clear error messages</li>
                    <li>• Form validation assistance</li>
                    <li>• Consistent layout</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">✅ Robust</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Semantic HTML markup</li>
                    <li>• ARIA attributes</li>
                    <li>• Cross-browser compatibility</li>
                    <li>• Assistive technology support</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keyboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </CardTitle>
              <CardDescription>
                Navigate the application efficiently using keyboard shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['navigation', 'search', 'general'].map((category) => (
                  <div key={category}>
                    <h3 className="font-medium mb-3 capitalize">{category} Shortcuts</h3>
                    <div className="grid gap-2">
                      {keyboardShortcuts
                        .filter(shortcut => shortcut.category === category)
                        .map((shortcut, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono">
                                {shortcut.key}
                              </Badge>
                              <span className="text-sm">{shortcut.description}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => testAccessibility(shortcut.key)}
                              aria-label={`Test ${shortcut.key} shortcut`}
                            >
                              <MousePointer className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="screen-reader" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Screen Reader Support
              </CardTitle>
              <CardDescription>
                Features designed for screen reader users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {screenReaderFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{feature.feature}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visual Accessibility
              </CardTitle>
              <CardDescription>
                Features for users with visual impairments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {visualFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{feature.feature}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Test Your Accessibility</CardTitle>
          <CardDescription>
            Try these accessibility features to see how they work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => {
                document.documentElement.setAttribute('data-high-contrast', 'true')
                announce('High contrast mode enabled')
              }}
              className="justify-start"
            >
              <Eye className="h-4 w-4 mr-2" />
              Enable High Contrast
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                document.documentElement.setAttribute('data-reduced-motion', 'true')
                announce('Reduced motion enabled')
              }}
              className="justify-start"
            >
              <X className="h-4 w-4 mr-2" />
              Enable Reduced Motion
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                document.documentElement.style.fontSize = '18px'
                announce('Text size increased')
              }}
              className="justify-start"
            >
              <Keyboard className="h-4 w-4 mr-2" />
              Increase Text Size
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Reset all accessibility settings
                document.documentElement.removeAttribute('data-high-contrast')
                document.documentElement.removeAttribute('data-reduced-motion')
                document.documentElement.style.fontSize = ''
                announce('Accessibility settings reset')
              }}
              className="justify-start"
            >
              <Check className="h-4 w-4 mr-2" />
              Reset Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}