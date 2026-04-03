"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import { NotificationBell } from './NotificationBell';
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
    <div className="flex min-h-screen bg-background text-foreground font-sans transition-colors duration-500 overflow-x-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Compact Modern Header */}
        <header className="h-14 bg-background/60 backdrop-blur-xl flex items-center justify-between px-6 md:px-10 sticky top-0 z-50">
          <div className="flex items-center gap-4">
             {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary">
                    <Menu className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px] border-r-0 bg-background">
                  <Sidebar isMobile />
                </SheetContent>
              </Sheet>
            )}
            <div className="hidden sm:flex items-center gap-3 relative group">
              <Search className="w-3.5 h-3.5 text-muted-foreground/40 absolute left-3.5 transition-colors group-focus-within:text-primary" />
              <input 
                type="text" 
                placeholder="Comando rápido (⌘K)" 
                className="bg-secondary/30 rounded-xl pl-10 pr-4 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 w-48 lg:w-64 transition-all duration-300 placeholder:text-muted-foreground/30 border border-transparent focus:border-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            
            <div className="h-4 w-[1px] bg-border/10 mx-1" />

            <Button onClick={() => window.location.href = '/instances/new'} className="bg-primary text-primary-foreground font-black text-[9px] h-9 px-4 rounded-xl shadow-lg shadow-primary/5 hover:opacity-90 transition-all uppercase tracking-[1px] flex gap-2">
               <PlusCircle className="w-3.5 h-3.5" /> <span className="hidden md:inline text-[8px]">Nueva Instancia</span>
            </Button>
          </div>
        </header>

        {/* Dense Main Content */}
        <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full">
          <div className="animate-in fade-in slide-in-from-bottom-1 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};