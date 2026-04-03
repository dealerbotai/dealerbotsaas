"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  hideText?: boolean;
}

export const Logo = ({ className, size = 'md', hideText = false }: LogoProps) => {
  const sizes = {
    sm: { container: 'w-8 h-8', text: 'text-base', sub: 'text-[7px]' },
    md: { container: 'w-10 h-10', text: 'text-xl', sub: 'text-[9px]' },
    lg: { container: 'w-14 h-14', text: 'text-3xl', sub: 'text-[11px]' }
  };

  const currentSize = sizes[size];

  return (
    <div className={cn("flex items-center gap-3 group cursor-default", className)}>
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        
        {/* Icon Container */}
        <div className={cn(
          "relative flex items-center justify-center bg-card rounded-xl overflow-hidden shadow-sm",
          currentSize.container
        )}>
          {/* Logo Image */}
          <img 
            src="/logodealer.png" 
            alt="Dealerbot Logo" 
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        
        {/* Status Dot */}
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-background shadow-[0_0_8px_rgba(93,187,137,0.5)]" />
      </div>

      {!hideText && (
        <div className="flex flex-col animate-in fade-in duration-500">
          <h1 className={cn(
            "font-black tracking-tighter text-foreground leading-none flex items-center",
            currentSize.text
          )}>
            DEALER<span className="text-primary">BOT</span>
            <span className="ml-1 w-1 h-1 bg-primary rounded-full animate-pulse" />
          </h1>
          <span className={cn(
            "font-black text-muted-foreground uppercase tracking-[4px] mt-1",
            currentSize.sub
          )}>
            Neural Systems
          </span>
        </div>
      )}
    </div>
  );
};