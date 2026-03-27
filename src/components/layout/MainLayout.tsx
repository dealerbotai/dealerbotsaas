"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
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
      <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
        <header className="h-16 border-b border-border flex items-center px-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-lg hover:bg-accent">
                <Menu className="w-5 h-5 text-muted-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r border-border bg-background">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <div className="ml-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-xs">N</span>
            </div>
            <span className="text-foreground font-bold tracking-tight text-sm">DealerBot AI</span>
          </div>
        </header>
        <main className="flex-1 p-6 relative overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background selection:bg-primary/10 overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-10 relative z-10">
        <div className="max-w-[1400px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};