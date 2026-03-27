import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  MessageSquare, 
  LogOut, 
  User, 
  Package, 
  Truck, 
  BarChart3,
  Moon,
  Sun
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: MessageSquare, label: 'Instancias', path: '/instances' },
  { icon: User, label: 'Agentes IA', path: '/agents' },
  { icon: Package, label: 'Productos', path: '/products' },
  { icon: Truck, label: 'Repartidores', path: '/delivery' },
  { icon: BarChart3, label: 'Ventas', path: '/sales' },
  { icon: Settings, label: 'Configuración', path: '/settings' },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-background border-r border-border p-6 sticky top-0 z-40">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-black text-lg">N</span>
        </div>
        <span className="text-foreground font-bold tracking-tight text-lg">DealerBot AI</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/instances' && location.pathname.startsWith('/instances'));
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium',
                  isActive
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive && "text-primary")} />
                <span>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-border space-y-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={() => setIsDark(!isDark)}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="text-sm font-medium">{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
        </Button>

        {user && (
          <div className="space-y-3">
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-accent/50 border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Usuario</p>
              <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors" 
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Salir</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};