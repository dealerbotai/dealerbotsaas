"use client";

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
    CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';

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

export const Sidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { workspace } = useWhatsApp();

  const planName = workspace?.plan || 'free';
  return (
    <div className="flex flex-col h-screen w-[280px] bg-card/50 backdrop-blur-xl border-r border-border/50 p-8 transition-all duration-500">
      <Logo className="mb-12 px-2" />

      <div className="flex flex-col flex-1 gap-10">
        <nav className="space-y-2">
          <p className="px-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[2px] mb-4">Explorar</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <div className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group mb-1',
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}>
                  <item.icon className={cn('w-4.5 h-4.5', isActive ? 'text-primary-foreground' : 'group-hover:text-primary')} />
                  <span className="text-sm font-bold tracking-tight">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <nav className="space-y-2">
          <p className="px-4 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[2px] mb-4">Administración</p>
          {secondaryItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
               <Link key={item.path} to={item.path}>
                 <div className={cn(
                   'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group mb-1',
                   isActive 
                     ? 'bg-secondary text-foreground border border-border shadow-sm' 
                     : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                 )}>
                   <item.icon className="w-4.5 h-4.5" />
                   <span className="text-sm font-bold tracking-tight">{item.label}</span>
                 </div>
               </Link>
             );
          })}
        </nav>
      </div>

      <div className="mt-auto pt-8 border-t border-border/50 space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-[24px] bg-secondary/40 border border-border/50">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-black shadow-inner">
            {user?.email?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-[11px] font-bold text-foreground truncate uppercase tracking-tight">{user?.email?.split('@')[0]}</p>
             <div className="flex items-center gap-1.5 opacity-70 mt-0.5">
                <Zap className={cn("w-2.5 h-2.5", planName !== 'free' ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Plan {planName}</p>
             </div>
          </div>
        </div>
        
        <Button 
            variant="ghost" 
            onClick={signOut}
            className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-2xl h-12 transition-all"
        >
            <LogOut className="w-4.5 h-4.5" />
            <span className="text-sm font-bold tracking-tight">Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  );
};