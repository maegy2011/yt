'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface SetupStatus {
  databaseConnected: boolean;
  tablesCreated: boolean;
  adminExists: boolean;
}

export default function SetupRedirect({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      // Don't check setup status on setup page itself
      if (pathname === '/setup') {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/setup/status');
      const data: SetupStatus = await response.json();
      setSetupStatus(data);

      // If database is not ready or admin user doesn't exist, redirect to setup
      if (!data.databaseConnected || !data.tablesCreated || !data.adminExists) {
        router.push('/setup');
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
      // If there's an error, assume setup is needed
      if (pathname !== '/setup') {
        router.push('/setup');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If we're on setup page, just render children
  if (pathname === '/setup') {
    return <>{children}</>;
  }

  // If setup is not complete, don't render children (redirect will happen)
  if (!setupStatus?.databaseConnected || !setupStatus?.tablesCreated || !setupStatus?.adminExists) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Setup is complete, render children
  return <>{children}</>;
}