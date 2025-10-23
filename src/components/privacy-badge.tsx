'use client';

import { Shield, Eye, Cookie, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function PrivacyBadge() {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1 cursor-help">
              <Shield className="h-3 w-3" />
              Privacy Protected
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cookie className="h-4 w-4 text-green-600" />
                <span className="text-sm">No tracking cookies</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />
                <span className="text-sm">Ad-free experience</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="text-sm">Secure connection</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}