import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, MessageSquare, LogOut, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const navItems = [
  { icon: LayoutDashboard, label: 'Panel de Control', path: '/' },
  { icon: MessageSquare, label: 'Instancias', path: '/instances' },
  { icon: User, label: 'Agentes IA', path: '/agents' },
  { icon: Settings, label: 'Configuración', path: '/settings' },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-[#0d0e12]/80 backdrop-blur-2xl border-r border-white/5 p-4 sticky top-0 z-40">
      <div className="flex items-center gap-3 px-2 mb-10">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-md rounded-full group-hover:bg-amber-500/40 transition-all" />
            <Logo className="w-9 h-9 relative z-10" />
          </div>
          <span className="text-nexus-gradient font-bold tracking-[0.15em] text-sm uppercase">Nexus Aurora</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/instances' && location.pathname.startsWith('/instances'));
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 px-4 py-6 rounded-xl transition-all duration-300 relative group',
                  isActive
                    ? 'text-amber-500 bg-amber-500/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-amber-500 rounded-r-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                )}
                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-amber-500")} />
                <span className="font-semibold tracking-wider text-[11px] uppercase">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/5 space-y-4">
        {user && (
          <div className="space-y-3">
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-gray-500 uppercase font-bold">Administrador</span>
              </div>
              <p className="text-[11px] font-mono text-gray-300 truncate pl-4">{user.email}</p>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 px-4 py-6 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-colors group" 
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-bold tracking-widest text-[11px] uppercase">Cerrar Sesión</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};