'use client';

import { Globe, Shield, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function AccessStatus() {
  const isExternalAccess = typeof window !== 'undefined' && 
    (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={isExternalAccess ? "default" : "secondary"} className="gap-1 cursor-help">
              <Globe className="h-3 w-3" />
              {isExternalAccess ? "External Access" : "Local Access"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Server: 0.0.0.0:3000</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm">CORS: Enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-600" />
                <span className="text-sm">Preview: Available</span>
              </div>
              {isExternalAccess && (
                <p className="text-xs text-muted-foreground mt-2">
                  External access is enabled for preview environments
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}