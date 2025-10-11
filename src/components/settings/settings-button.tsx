'use client';

import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface SettingsButtonProps {
  onSettingsClick?: () => void;
  onThemeToggle?: () => void;
}

export function SettingsButton({ onSettingsClick, onThemeToggle }: SettingsButtonProps) {
  const { toast } = useToast();

  const handleThemeToggle = () => {
    if (onThemeToggle) {
      onThemeToggle();
    } else {
      toast({
        title: 'تغيير المظهر',
        description: 'يمكنك تغيير المظهر من صفحة الإعدادات',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onSettingsClick}>
          <SettingsIcon className="h-4 w-4 ml-2" />
          الإعدادات
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleThemeToggle}>
          <SettingsIcon className="h-4 w-4 ml-2" />
          تبديل المظهر
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}