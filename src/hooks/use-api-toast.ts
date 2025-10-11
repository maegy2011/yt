'use client';

import { useToast } from '@/hooks/use-toast';

export function useApiToast() {
  const { toast } = useToast();

  const showError = (message: string, description?: string) => {
    toast({
      variant: 'destructive',
      title: message,
      description: description,
    });
  };

  const showSuccess = (message: string, description?: string) => {
    toast({
      title: message,
      description: description,
    });
  };

  const showInfo = (message: string, description?: string) => {
    toast({
      variant: 'default',
      title: message,
      description: description,
    });
  };

  return {
    showError,
    showSuccess,
    showInfo,
  };
}