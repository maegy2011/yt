'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Share2, 
  Copy, 
  Mail, 
  MessageCircle, 
  Send,
  ExternalLink,
  Check,
  Facebook,
  Twitter,
  Send as SendIcon
} from 'lucide-react'
import { Notebook } from '@/types/notes'

interface ShareNotebookDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notebook: Notebook
  noteCount: number
}

interface ShareMethod {
  id: string
  name: string
  icon: React.ReactNode
  color: string
}

export function ShareNotebookDialog({ 
  open, 
  onOpenChange, 
  notebook,
  noteCount 
}: ShareNotebookDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('link')
  const [customMessage, setCustomMessage] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const shareMethods: ShareMethod[] = [
    {
      id: 'link',
      name: 'Copy Link',
      icon: <Copy className="w-4 h-4" />,
      color: 'bg-gray-500'
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="w-4 h-4" />,
      color: 'bg-blue-500'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle className="w-4 h-4" />,
      color: 'bg-green-500'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter className="w-4 h-4" />,
      color: 'bg-sky-500'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="w-4 h-4" />,
      color: 'bg-blue-600'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <SendIcon className="w-4 h-4" />,
      color: 'bg-blue-500'
    }
  ]

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const response = await fetch(`/api/notebooks/${notebook.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: selectedMethod,
          message: customMessage
        })
      })

      const data = await response.json()

      if (data.success) {
        setShareUrl(data.shareUrl)
        
        if (selectedMethod === 'link') {
          // Auto-copy to clipboard
          await navigator.clipboard.writeText(data.shareUrl)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } else {
          // Open share URL in new window
          window.open(data.shareUrl, '_blank', 'width=600,height=400')
        }
      }
    } catch (error) {
      console.error('Failed to share notebook:', error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const getShareDescription = () => {
    const baseDescription = notebook.description || `A collection of ${noteCount} video notes`
    const tags = notebook.tags ? notebook.tags.split(',').filter(tag => tag.trim()).slice(0, 3).join(', ') : ''
    
    let description = `📓 ${notebook.title}\n${baseDescription}`
    
    if (tags) {
      description += `\n\nTags: ${tags}`
    }
    
    if (customMessage) {
      description = `${customMessage}\n\n${description}`
    }
    
    return description
  }

  const getNotebookColor = (color: string) => {
    const colorMap: Record<string, string> = {
      '#3b82f6': 'bg-blue-500',
      '#ef4444': 'bg-red-500',
      '#10b981': 'bg-green-500',
      '#f59e0b': 'bg-yellow-500',
      '#8b5cf6': 'bg-purple-500',
      '#ec4899': 'bg-pink-500',
      '#6b7280': 'bg-gray-500',
    }
    return colorMap[color] || 'bg-blue-500'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Notebook
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Notebook Info */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <div className={`w-4 h-4 rounded-full ${getNotebookColor(notebook.color)}`} />
            <div className="flex-1">
              <h3 className="font-medium">{notebook.title}</h3>
              <p className="text-sm text-muted-foreground">
                {noteCount} note{noteCount !== 1 ? 's' : ''}
              </p>
            </div>
            <Badge variant={notebook.isPublic ? 'default' : 'secondary'}>
              {notebook.isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>

          {/* Share Method Selection */}
          <div className="space-y-3">
            <Label>Share via:</Label>
            <div className="grid grid-cols-3 gap-2">
              {shareMethods.map((method) => (
                <Button
                  key={method.id}
                  variant={selectedMethod === method.id ? 'default' : 'outline'}
                  onClick={() => setSelectedMethod(method.id)}
                  className="flex flex-col items-center gap-2 h-auto p-3"
                >
                  <div className={`p-2 rounded-full ${method.color} text-white`}>
                    {method.icon}
                  </div>
                  <span className="text-xs">{method.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Custom message (optional):</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview:</Label>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <pre className="whitespace-pre-wrap font-sans">
                {getShareDescription()}
              </pre>
            </div>
          </div>

          {/* Share URL Display */}
          {shareUrl && (
            <div className="space-y-2">
              <Label>Share link:</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSharing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center gap-2"
          >
            {isSharing ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : selectedMethod === 'link' ? (
              <Copy className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {selectedMethod === 'link' ? 'Copy Link' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}