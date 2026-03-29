"use client";

import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo = ({ className, size = 'md' }: LogoProps) => {
  const sizes = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-base', sub: 'text-[7px]' },
    md: { container: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-xl', sub: 'text-[9px]' },
    lg: { container: 'w-14 h-14', icon: 'w-7 h-7', text: 'text-3xl', sub: 'text-[11px]' }
  };

  const currentSize = sizes[size];

  return (
    <div className={cn("flex items-center gap-3 group cursor-default", className)}>
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        
        {/* Icon Container */}
        <div className={cn(
          "relative flex items-center justify-center bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden shadow-2xl",
          currentSize.container
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/5" />
          
          {/* Animated Zap */}
          <Zap className={cn(
            "text-cyan-400 fill-cyan-400/10 transition-transform duration-500 group-hover:scale-110",
            currentSize.icon
          )} />
          
          {/* Scanning Line Effect */}
          <div className="absolute inset-0 w-full h-[1px] bg-cyan-400/20 top-0 animate-[scan_3s_linear_infinite]" />
        </div>
        
        {/* Status Dot */}
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0f172a] shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
      </div>

      <div className="flex flex-col">
        <h1 className={cn(
          "font-black tracking-tighter text-white leading-none flex items-center",
          currentSize.text
        )}>
          DEALER<span className="text-cyan-400">BOT</span>
          <span className="ml-1 w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
        </h1>
        <span className={cn(
          "font-black text-slate-500 uppercase tracking-[4px] mt-1",
          currentSize.sub
        )}>
          Neural Systems
        </span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(40px); opacity: 0; }
        }
      `}} />
    </div>
  );
};