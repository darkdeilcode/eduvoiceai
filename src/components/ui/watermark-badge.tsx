'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface WatermarkBadgeProps {
  className?: string;
}

export function WatermarkBadge({ className }: WatermarkBadgeProps) {
  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "bg-white/80 backdrop-blur-sm border border-gray-200/50",
        "rounded-full px-3 py-1.5 shadow-sm",
        "text-xs text-gray-500 font-medium",
        "hover:bg-white/90 transition-all duration-200",
        "select-none pointer-events-none",
        className
      )}
    >
      <span className="flex items-center gap-1.5">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-blue-500"
        >
          <path
            d="M13 3L4 14h7l-1 8 9-11h-7l1-8z"
            fill="currentColor"
          />
        </svg>
        Built with Bolt.new
      </span>
    </div>
  );
}

export default WatermarkBadge;