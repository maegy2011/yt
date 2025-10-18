'use client'

import { 
  User, 
  HelpCircle, 
  MessageSquare,
  LogOut, 
  Languages, 
  CreditCard,
  Keyboard,
  Smartphone,
  Tv,
  Download,
  Upload,
  Clock,
  Library,
  ThumbsUp,
  Bell,
  Lock,
  Eye,
  ChevronRight
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/theme-toggle'

interface UserProfileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserProfileMenu({ isOpen, onClose }: UserProfileMenuProps) {
  const accountItems = [
    { icon: User, label: "Your channel", description: "Manage your channel" },
    { icon: CreditCard, label: "Purchases and memberships", description: "View your purchases" },
    { icon: Clock, label: "Your data in YouTube", description: "Manage your data" },
  ]

  const appearanceItems = [
    { icon: Languages, label: "Language", description: "English (US)" },
    { icon: Tv, label: "Location", description: "United States" },
    { icon: Keyboard, label: "Keyboard shortcuts", description: "View shortcuts" },
  ]

  const privacyItems = [
    { icon: Lock, label: "Privacy", description: "Manage your privacy" },
    { icon: Eye, label: "Watch history", description: "View and manage" },
    { icon: Library, label: "Your data in YouTube", description: "Manage your data" },
  ]

  const notificationItems = [
    { icon: Bell, label: "Notifications", description: "Manage notifications" },
    { icon: ThumbsUp, label: "Subscriptions", description: "Manage subscriptions" },
  ]

  const connectivityItems = [
    { icon: Smartphone, label: "Connected apps", description: "Manage connected apps" },
    { icon: Download, label: "Downloads", description: "View downloads" },
    { icon: Upload, label: "Uploads", description: "Manage uploads" },
  ]

  const supportItems = [
    { icon: HelpCircle, label: "Help", description: "Get help" },
    { icon: MessageSquare, label: "Send feedback", description: "Help us improve" },
  ]

  const bottomItems = [
    { icon: LogOut, label: "Sign out", description: "Sign out of your account" },
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Profile Menu */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Google Account</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <span className="text-gray-500 dark:text-gray-400">×</span>
              </Button>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=48&h=48&fit=crop&crop=face" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium text-base text-gray-900 dark:text-white">John Doe</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">johndoe@gmail.com</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Manage your Google Account</div>
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
              Account
            </h3>
            <div className="space-y-1">
              {accountItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start px-3 py-3 h-auto rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <item.icon className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-200 dark:bg-gray-800" />

          {/* Appearance Section */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
              Appearance
            </h3>
            <div className="space-y-1">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <div className="flex items-center">
                  <div className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400">
                    <ThemeToggle />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">Theme</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Dark, light, or system</div>
                  </div>
                </div>
              </div>
              
              {appearanceItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start px-3 py-3 h-auto rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <item.icon className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-200 dark:bg-gray-800" />

          {/* Privacy Section */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
              Privacy
            </h3>
            <div className="space-y-1">
              {privacyItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start px-3 py-3 h-auto rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <item.icon className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-200 dark:bg-gray-800" />

          {/* Notifications Section */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
              Notifications
            </h3>
            <div className="space-y-1">
              {notificationItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start px-3 py-3 h-auto rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <item.icon className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-200 dark:bg-gray-800" />

          {/* Connectivity Section */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
              Connectivity
            </h3>
            <div className="space-y-1">
              {connectivityItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start px-3 py-3 h-auto rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <item.icon className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-200 dark:bg-gray-800" />

          {/* Support Section */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
              Support
            </h3>
            <div className="space-y-1">
              {supportItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start px-3 py-3 h-auto rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <item.icon className="h-5 w-5 mr-3 text-gray-600 dark:text-gray-400" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-200 dark:bg-gray-800" />

          {/* Bottom Section */}
          <div className="p-4">
            <div className="space-y-1">
              {bottomItems.map((item, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start px-3 py-3 h-auto rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600 dark:text-red-400"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800">
            <div className="space-y-1">
              <div>Privacy Policy • Terms of Service</div>
              <div>© 2024 Google LLC</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}