"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import { Logo } from './Logo';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex flex-col selection:bg-amber-500/30">
        <header className="h-16 border-b border-white/5 flex items-center px-4 bg-[#0d0e12]/80 backdrop-blur-xl sticky top-0 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
                <Menu className="w-6 h-6 text-gray-400" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r border-white/5 bg-[#0d0e12]">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="ml-4 flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-nexus-gradient font-bold tracking-wider text-sm uppercase">Nexus Aurora</span>
          </div>
        </header>
        <main className="flex-1 p-4 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0d0e12] selection:bg-amber-500/30 overflow-hidden relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8 relative z-10">
        <div className="max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};