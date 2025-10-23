'use client';

import { Shield, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function PrivacyPolicy() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs">
          <FileText className="h-3 w-3 mr-1" />
          Privacy Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Policy
          </DialogTitle>
          <DialogDescription>
            Your privacy is our top priority. Learn how we protect your data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <h3 className="font-semibold mb-2">🛡️ No Data Collection</h3>
            <p className="text-sm text-muted-foreground">
              We do not collect, store, or share any personal information. Your searches, 
              viewing history, and personal data remain completely private.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">🚫 Ad-Free Experience</h3>
            <p className="text-sm text-muted-foreground">
              No advertisements, tracking scripts, or third-party analytics. 
              Enjoy clean, uninterrupted video browsing.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">🔒 Secure Connection</h3>
            <p className="text-sm text-muted-foreground">
              All connections use HTTPS encryption. We implement strict security headers 
              and Content Security Policy to protect against malicious attacks.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">🌍 Privacy-Enhanced YouTube</h3>
            <p className="text-sm text-muted-foreground">
              We use YouTube's privacy-enhanced embed (youtube-nocookie.com) to prevent 
              tracking cookies and protect your viewing privacy.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">📊 No Analytics or Tracking</h3>
            <p className="text-sm text-muted-foreground">
              We don't use Google Analytics, Facebook Pixel, or any tracking services. 
              Your behavior is not monitored or analyzed.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">🔐 Technical Protections</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Content Security Policy (CSP) headers</li>
              <li>• Strict Transport Security (HTTPS only)</li>
              <li>• X-Frame-Options protection</li>
              <li>• X-XSS-Protection enabled</li>
              <li>• No referrer tracking</li>
              <li>• Sandbox iframes for security</li>
            </ul>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              This privacy policy is effective as of the date you access this service. 
              We are committed to maintaining your privacy and will never compromise on data protection.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}