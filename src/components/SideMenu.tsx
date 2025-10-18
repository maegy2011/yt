'use client'

import { 
  Home, 
  PlaySquare, 
  SquarePlus, 
  User, 
  Library, 
  History, 
  Clock, 
  ThumbsUp, 
  Film,
  Gamepad2,
  Newspaper,
  Trophy,
  Lightbulb,
  Shirt,
  Podcast,
  Radio,
  Settings,
  Flag,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  TrendingUp,
  Music,
  RadioIcon,
  ShoppingBag
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const mainItems = [
    { icon: Home, label: "Home", active: true },
    { icon: PlaySquare, label: "Shorts" },
    { icon: SquarePlus, label: "Create" },
    { icon: TrendingUp, label: "Subscriptions" },
  ]

  const exploreItems = [
    { icon: TrendingUp, label: "Trending" },
    { icon: Music, label: "Music" },
    { icon: Film, label: "Movies & TV" },
    { icon: RadioIcon, label: "Live" },
    { icon: Gamepad2, label: "Gaming" },
    { icon: Newspaper, label: "News" },
    { icon: Trophy, label: "Sports" },
    { icon: Lightbulb, label: "Learning" },
    { icon: Shirt, label: "Fashion & Beauty" },
    { icon: Podcast, label: "Podcasts" },
    { icon: Radio, label: "Radio" },
    { icon: ShoppingBag, label: "Shopping" },
  ]

  const youItems = [
    { icon: User, label: "Your channel" },
    { icon: History, label: "History" },
    { icon: PlaySquare, label: "Your videos" },
    { icon: Clock, label: "Watch later" },
    { icon: ThumbsUp, label: "Liked videos" },
  ]

  const moreYouTubeItems = [
    { icon: PlaySquare, label: "YouTube Premium" },
    { icon: Music, label: "YouTube Music" },
    { icon: User, label: "YouTube Kids" },
  ]

  const settingsItems = [
    { icon: Settings, label: "Settings" },
    { icon: Flag, label: "Report history" },
    { icon: HelpCircle, label: "Help" },
    { icon: MessageSquare, label: "Send feedback" },
  ]

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Side Menu */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">Y</span>
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">YouTube</span>
            </div>
          </div>

          {/* User Profile Section */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=36&h=36&fit=crop&crop=face" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900 dark:text-white">John Doe</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">@johndoe</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          {/* Main Items */}
          <div className="py-1">
            {mainItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className={`w-full justify-start px-3 py-2 h-auto rounded-none ${
                  item.active 
                    ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className="h-5 w-5 mr-6" />
                <span className="text-sm">{item.label}</span>
              </Button>
            ))}
          </div>

          <Separator className="my-1 bg-gray-200 dark:bg-gray-800" />

          {/* You Section */}
          <div className="py-1">
            <div className="px-3 py-2">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                You
              </div>
            </div>
            {youItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start px-3 py-2 h-auto rounded-none text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <item.icon className="h-5 w-5 mr-6" />
                <span className="text-sm">{item.label}</span>
              </Button>
            ))}
          </div>

          <Separator className="my-1 bg-gray-200 dark:bg-gray-800" />

          {/* Explore Section */}
          <div className="py-1">
            <div className="px-3 py-2">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Explore
              </div>
            </div>
            {exploreItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start px-3 py-2 h-auto rounded-none text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <item.icon className="h-5 w-5 mr-6" />
                <span className="text-sm">{item.label}</span>
              </Button>
            ))}
          </div>

          <Separator className="my-1 bg-gray-200 dark:bg-gray-800" />

          {/* More from YouTube */}
          <div className="py-1">
            <div className="px-3 py-2">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                More from YouTube
              </div>
            </div>
            {moreYouTubeItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start px-3 py-2 h-auto rounded-none text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <item.icon className="h-5 w-5 mr-6" />
                <span className="text-sm">{item.label}</span>
              </Button>
            ))}
          </div>

          <Separator className="my-1 bg-gray-200 dark:bg-gray-800" />

          {/* Settings */}
          <div className="py-1">
            {settingsItems.map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start px-3 py-2 h-auto rounded-none text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <item.icon className="h-5 w-5 mr-6" />
                <span className="text-sm">{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800">
            <div className="space-y-1">
              <div>About Press Copyright</div>
              <div>Contact us Creators</div>
              <div>Advertise Developers</div>
              <div>Terms Privacy Policy & Safety</div>
              <div>How YouTube works</div>
              <div>Test new features</div>
            </div>
            <div className="mt-3">© 2024 Google LLC</div>
          </div>
        </div>
      </div>
    </>
  )
}