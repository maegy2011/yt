'use client';

import { useState } from 'react';
import { Shield, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface PrivacySettingsProps {
  children: React.ReactNode;
}

export function PrivacySettings({ children }: PrivacySettingsProps) {
  const [privacyMode, setPrivacyMode] = useState(true);
  const [blockAds, setBlockAds] = useState(true);
  const [noTracking, setNoTracking] = useState(true);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security Settings
          </DialogTitle>
          <DialogDescription>
            Configure your privacy preferences for a safer browsing experience.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="privacy-mode">Privacy Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use YouTube's privacy-enhanced embed
                </p>
              </div>
              <Switch
                id="privacy-mode"
                checked={privacyMode}
                onCheckedChange={setPrivacyMode}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="block-ads">Ad Blocking</Label>
                <p className="text-sm text-muted-foreground">
                  Block advertisements and tracking
                </p>
              </div>
              <Switch
                id="block-ads"
                checked={blockAds}
                onCheckedChange={setBlockAds}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="no-tracking">No Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Prevent tracking cookies and scripts
                </p>
              </div>
              <Switch
                id="no-tracking"
                checked={noTracking}
                onCheckedChange={setNoTracking}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Active Protections</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                ✅ No Cookies
              </Badge>
              <Badge variant="secondary" className="text-xs">
                ✅ HTTPS Only
              </Badge>
              <Badge variant="secondary" className="text-xs">
                ✅ No Tracking
              </Badge>
              <Badge variant="secondary" className="text-xs">
                ✅ Ad-Free
              </Badge>
              <Badge variant="secondary" className="text-xs">
                ✅ Secure Headers
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}