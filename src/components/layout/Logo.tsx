import React from 'react';

export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className.includes('w-') ? '' : 'w-auto'}`}>
      <div className={`relative flex items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30 ${className}`}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-2/3 h-2/3 text-primary-foreground"
        >
          <path 
            d="M13 2L3 14H12L11 22L21 10H12L13 2Z" 
            fill="currentColor" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
      </div>
      <span className="text-xl font-black tracking-tighter uppercase italic">
        Sales<span className="text-primary">Bot</span>
      </span>
    </div>
  );
};
