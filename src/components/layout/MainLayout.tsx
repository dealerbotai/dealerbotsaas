"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, Search, Bell, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Desktop Sidebar (Left) */}
      {!isMobile && <Sidebar />}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Superior Header - Glassmorphism style */}
        <header className="h-16 bg-[#0f172a]/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center gap-4">
             {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 border border-white/10">
                    <Menu className="w-5 h-5 text-slate-300" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 border-r-0 bg-[#0f172a]">
                  <Sidebar />
                </SheetContent>
              </Sheet>
            )}
            <div className="flex items-center gap-3 relative group">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 transition-colors group-focus-within:text-cyan-400" />
              <input 
                type="text" 
                placeholder="Buscar en el sistema..." 
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 w-48 sm:w-64 transition-all duration-300 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:bg-white/5 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#0f172a]" />
            </Button>
            <div className="h-6 w-[1px] bg-white/10 mx-1" />
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs h-10 rounded-xl shadow-lg shadow-cyan-500/20 px-5 flex gap-2 transition-all ai-glow-hover uppercase tracking-wider">
               <PlusCircle className="w-4 h-4" /> <span className="hidden sm:inline">Nueva Instancia</span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 max-w-[1600px] mx-auto w-full transition-all duration-500">
          {children}
        </main>
      </div>
    </div>
  );
};