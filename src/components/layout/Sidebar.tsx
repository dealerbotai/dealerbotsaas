import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, MessageSquare, PlusCircle, Bot, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: LayoutDashboard, label: 'Panel de Control', path: '/' },
  { icon: MessageSquare, label: 'Instancias', path: '/instances' },
  { icon: Globe, label: 'Escáner de Tienda', path: '/settings#scraper' },
  { icon: Settings, label: 'Configuración', path: '/settings' },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen w-64 bg-card border-r border-border p-4">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="bg-primary p-2 rounded-xl">
          <Bot className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">WhatsApp Bot</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 px-3 py-6 rounded-xl transition-all duration-200',
                location.pathname === item.path
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Button>
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-border">
        <div className="bg-accent/50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Estado del Sistema
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">Sistemas operativos</span>
          </div>
        </div>
      </div>
    </div>
  );
};