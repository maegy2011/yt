'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  EyeOff, 
  Shield, 
  Clock, 
  Trash2,
  Info,
  CheckCircle 
} from 'lucide-react'
import { useIncognito } from '@/contexts/incognito-context'
import { useToast } from '@/hooks/use-toast'

export function IncognitoToggle() {
  const { 
    isIncognito, 
    enableIncognito, 
    disableIncognito, 
    getIncognitoDuration 
  } = useIncognito()
  
  const { toast } = useToast()
  const [showEnableDialog, setShowEnableDialog] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)

  const handleEnableIncognito = () => {
    enableIncognito()
    setShowEnableDialog(false)
    toast({
      title: "Incognito mode enabled",
      description: "Your browsing activity won't be saved",
      duration: 3000,
    })
  }

  const handleDisableIncognito = () => {
    disableIncognito()
    setShowDisableDialog(false)
    toast({
      title: "Incognito mode disabled",
      description: "Your browsing activity will be saved again",
      duration: 3000,
    })
  }

  const getIcon = () => {
    return isIncognito ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />
  }

  const getLabel = () => {
    return isIncognito ? "Incognito" : "Normal"
  }

  const getBadgeVariant = () => {
    return isIncognito ? "destructive" : "secondary"
  }

  if (isIncognito) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-9 px-0 relative group"
            >
              {getIcon()}
              <span className="sr-only">Toggle incognito mode</span>
              <Badge 
                variant={getBadgeVariant()} 
                className="absolute -top-1 -right-1 w-2 h-2 p-0 animate-pulse"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-3 border-b">
              <div className="flex items-center gap-2 mb-2">
                <EyeOff className="h-4 w-4 text-destructive" />
                <span className="font-medium text-sm">Incognito Mode</span>
                <Badge variant="destructive" className="ml-auto text-xs">
                  Active
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Duration: {getIncognitoDuration()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>Privacy protection enabled</span>
                </div>
              </div>
            </div>
            
            <DropdownMenuItem 
              onClick={() => setShowDisableDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Eye className="h-4 w-4 mr-2" />
              Exit Incognito Mode
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              <Info className="h-3 w-3 mr-2" />
              Features disabled in incognito:
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
              • Favorites
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
              • Notes
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
              • Watch History
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
              • Search History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Exit Incognito Mode?
              </AlertDialogTitle>
              <AlertDialogDescription>
                All your incognito session data will be permanently deleted. Your browsing activity will start being saved again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Stay Incognito</AlertDialogCancel>
              <AlertDialogAction onClick={handleDisableIncognito}>
                Exit Incognito
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 px-0">
            {getIcon()}
            <span className="sr-only">Toggle incognito mode</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-3 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4" />
              <span className="font-medium text-sm">Normal Mode</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                Active
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>All features enabled</span>
              </div>
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Browsing activity is saved</span>
              </div>
            </div>
          </div>
          
          <DropdownMenuItem onClick={() => setShowEnableDialog(true)}>
            <EyeOff className="h-4 w-4 mr-2" />
            Enable Incognito Mode
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            <Info className="h-3 w-3 mr-2" />
            Incognito mode prevents saving:
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
            • Watch history
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
            • Search history
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-xs text-muted-foreground pl-6">
            • Favorites and notes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <EyeOff className="h-5 w-5" />
              Enable Incognito Mode?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your browsing activity won't be saved to your account. This includes:
              <ul className="mt-2 text-sm list-disc list-inside">
                <li>Watch history</li>
                <li>Search history</li>
                <li>Favorites and notes</li>
                <li>Channel subscriptions</li>
              </ul>
              Downloads and some site data may still be saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnableIncognito}>
              Enable Incognito
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}