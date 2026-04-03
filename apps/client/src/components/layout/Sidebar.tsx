"use client";

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { 
    LayoutDashboard, 
    Settings, 
    MessageSquare, 
    Bot, 
    BarChart3,
    LogOut,
    Store,
    Zap,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: MessageSquare, label: 'Instancias WA', path: '/instances' },
  { icon: Zap, label: 'Pedidos', path: '/orders' },
  { icon: Store, label: 'Tiendas', path: '/stores' },
  { icon: Bot, label: 'Agentes IA', path: '/agents' },
  { icon: BarChart3, label: 'Analíticas', path: '/analytics' },
];

const secondaryItems = [
  { icon: CreditCard, label: 'Plan y Membresía', path: '/billing' },
  { icon: Settings, label: 'Configuración', path: '/settings' },
];

interface SidebarProps {
  isMobile?: boolean;
}

export const Sidebar = ({ isMobile = false }: SidebarProps) => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { workspace } = useWhatsApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const planName = workspace?.plan || 'free';
  const effectiveCollapsed = isCollapsed && !isMobile;

  const NavLink = ({ item, isActive }: { item: any, isActive: boolean }) => {
    const content = (
      <div className={cn(
        'flex items-center rounded-2xl transition-all duration-300 group relative mb-1',
        effectiveCollapsed ? 'justify-center p-3 w-12 h-12 mx-auto' : 'gap-3 px-4 py-3',
        isActive 
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      )}>
        <item.icon className={cn('shrink-0 transition-all', effectiveCollapsed ? 'w-5 h-5' : 'w-4.5 h-4.5', isActive ? 'text-primary-foreground' : 'group-hover:text-primary')} />
        {!effectiveCollapsed && <span className="text-sm font-bold tracking-tight whitespace-nowrap overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
        
        {effectiveCollapsed && isActive && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full shadow-[0_0_10px_rgba(6,78,59,0.5)]" />
        )}
      </div>
    );

    if (effectiveCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to={item.path}>{content}</Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-primary text-primary-foreground font-bold border-none px-3 py-1.5 rounded-lg text-xs">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <Link to={item.path}>{content}</Link>;
  };

  return (
    <div className={cn(
      "relative flex flex-col h-screen bg-card/50 backdrop-blur-xl transition-all duration-500 ease-in-out z-[60] font-outfit",
      effectiveCollapsed ? "w-[90px] p-4" : "w-[280px] p-8"
    )}>
      {/* Collapse Toggle Button */}
      {!isMobile && (
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all z-50 text-primary group"
        >
          {effectiveCollapsed ? <ChevronRight className="w-3.5 h-3.5 group-hover:scale-110" /> : <ChevronLeft className="w-3.5 h-3.5 group-hover:scale-110" />}
        </button>
      )}

      <Logo className={cn("mb-12", effectiveCollapsed ? "px-0 justify-center" : "px-2")} hideText={effectiveCollapsed} />

      <div className="flex flex-col flex-1 gap-10 overflow-y-auto no-scrollbar">
        <nav className="space-y-1">
          {!effectiveCollapsed && <p className="px-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[2px] mb-4 animate-in fade-in duration-500">Explorar</p>}
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} isActive={location.pathname === item.path} />
          ))}
        </nav>

        <nav className="space-y-1">
          {!effectiveCollapsed && <p className="px-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[2px] mb-4 animate-in fade-in duration-500">Administración</p>}
          {secondaryItems.map((item) => (
            <NavLink key={item.path} item={item} isActive={location.pathname === item.path} />
          ))}
        </nav>
      </div>

      <div className={cn("mt-auto pt-8 space-y-6", effectiveCollapsed ? "items-center" : "")}>
        <div className={cn(
          "flex items-center rounded-[24px] bg-secondary/40 transition-all duration-300",
          effectiveCollapsed ? "justify-center p-2 w-12 h-12 mx-auto" : "gap-4 p-4"
        )}>
          <div className="shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-black shadow-inner">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          {!effectiveCollapsed && (
            <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
               <p className="text-[11px] font-bold text-foreground truncate uppercase tracking-tight">{user?.email?.split('@')[0]}</p>
               <div className="flex items-center gap-1.5 opacity-70 mt-0.5">
                  <Zap className={cn("w-2.5 h-2.5", planName !== 'free' ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Plan {planName}</p>
               </div>
            </div>
          )}
        </div>
        
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                  variant="ghost" 
                  onClick={signOut}
                  className={cn(
                    "w-full justify-start transition-all duration-300 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-2xl h-12",
                    effectiveCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : "gap-3 px-4 py-3"
                  )}
              >
                  <LogOut className={cn("shrink-0", effectiveCollapsed ? "w-5 h-5" : "w-4.5 h-4.5")} />
                  {!effectiveCollapsed && <span className="text-sm font-bold tracking-tight animate-in fade-in duration-300">Cerrar Sesión</span>}
              </Button>
            </TooltipTrigger>
            {effectiveCollapsed && (
              <TooltipContent side="right" className="bg-destructive text-white font-bold border-none px-3 py-1.5 rounded-lg text-xs">
                Cerrar Sesión
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};