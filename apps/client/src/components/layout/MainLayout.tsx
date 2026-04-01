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
    <div className="flex min-h-screen bg-background text-foreground font-sans transition-colors duration-500 overflow-x-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Modern Header */}
        <header className="h-20 bg-background/60 backdrop-blur-xl flex items-center justify-between px-8 md:px-12 sticky top-0 z-50">
          <div className="flex items-center gap-6">
             {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-secondary">
                    <Menu className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px] border-r-0 bg-background">
                  <Sidebar />
                </SheetContent>
              </Sheet>
            )}
            <div className="hidden sm:flex items-center gap-3 relative group">
              <Search className="w-4 h-4 text-muted-foreground/50 absolute left-4 transition-colors group-focus-within:text-primary" />
              <input 
                type="text" 
                placeholder="Buscar recursos..." 
                className="bg-secondary/40 rounded-2xl pl-11 pr-6 py-2.5 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 w-64 lg:w-80 transition-all duration-500 placeholder:text-muted-foreground/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl text-muted-foreground hover:bg-secondary transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-destructive rounded-full border-2 border-background shadow-sm" />
            </Button>
            
            <Button className="bg-primary text-primary-foreground font-bold text-[11px] h-11 px-6 rounded-2xl shadow-xl shadow-primary/10 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[1px] flex gap-2">
               <PlusCircle className="w-4 h-4" /> <span className="hidden md:inline">Nueva Instancia</span>
            </Button>
          </div>
        </header>

        {/* Spacious Main Content */}
        <main className="flex-1 p-8 md:p-12 lg:p-16 max-w-[1600px] mx-auto w-full transition-all duration-500">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};