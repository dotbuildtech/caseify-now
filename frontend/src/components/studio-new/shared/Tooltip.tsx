'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function Tooltip({ content, children, side = 'bottom', className }: TooltipProps) {
  const [show, setShow] = useState(false);

  const positions: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <div
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={cn(
          'absolute z-[100] whitespace-nowrap rounded-lg bg-popover px-2.5 py-1.5 text-[10px] font-medium text-popover-foreground shadow-lg border border-border animate-in fade-in zoom-in-95',
          positions[side]
        )}>
          {content}
        </div>
      )}
    </div>
  );
}
