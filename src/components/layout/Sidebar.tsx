"use client";

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
    LayoutDashboard, 
    Settings, 
    MessageSquare, 
    Bot, 
    BarChart3,
    LogOut,
    Store,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: MessageSquare, label: 'Instancias WA', path: '/instances' },
  { icon: Store, label: 'Tiendas', path: '/stores' },
  { icon: Bot, label: 'Agentes IA', path: '/agents' },
  { icon: BarChart3, label: 'Analíticas', path: '/analytics' },
];

const secondaryItems = [
  { icon: Settings, label: 'Configuración', path: '/settings' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <div className="flex flex-col h-screen w-64 bg-[#0f172a]/80 backdrop-blur-xl border-r border-white/10 p-6">
      <Logo className="mb-10 px-2" />

      <div className="flex flex-col flex-1 gap-8">
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Menú Principal</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <div className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group mb-1',
                  isActive 
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 ai-glow' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                )}>
                  <item.icon className={cn('w-4 h-4', isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400')} />
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Sistema</p>
          {secondaryItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
               <Link key={item.path} to={item.path}>
                 <div className={cn(
                   'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group mb-1',
                   isActive 
                     ? 'bg-white/10 text-white' 
                     : 'text-slate-400 hover:bg-white/5 hover:text-white'
                 )}>
                   <item.icon className="w-4 h-4" />
                   <span className="text-sm font-semibold">{item.label}</span>
                 </div>
               </Link>
             );
          })}
        </nav>
      </div>

      <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-black uppercase shadow-lg">
            {user?.email?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">{user?.email?.split('@')[0]}</p>
             <div className="flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-orange-500" />
                <p className="text-[9px] text-orange-500 font-black uppercase tracking-tight">Plan Premium</p>
             </div>
          </div>
        </div>
        
        <Button 
            variant="ghost" 
            onClick={signOut}
            className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl h-11"
        >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-semibold">Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  );
};