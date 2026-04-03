import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuHeader,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { socket } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 20)); // Keep last 20
  };

  useEffect(() => {
    const handleStatusUpdate = (data: { instanceId: string; status: string; error?: string }) => {
        if (data.status === 'connected') {
            addNotification({
                type: 'success',
                title: 'Instancia Conectada',
                message: `La instancia ${data.instanceId.substring(0, 8)} ahora está online.`
            });
        } else if (data.status === 'disconnected') {
             addNotification({
                type: 'error',
                title: 'Instancia Desconectada',
                message: data.error || `Se ha perdido la conexión con la instancia.`
            });
        }
    };

    const handleReady = (data: { instanceId: string }) => {
        addNotification({
            type: 'success',
            title: 'Motor Listo',
            message: `El motor de WhatsApp ${data.instanceId.substring(0, 8)} está operativo.`
        });
    };

    socket.on('instance-status-update', handleStatusUpdate);
    socket.on('ready', handleReady);

    return () => {
      socket.off('instance-status-update', handleStatusUpdate);
      socket.off('ready', handleReady);
    };
  }, []);

  const markAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && markAsRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-secondary transition-all relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full border border-background shadow-sm animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 border-none bg-popover shadow-2xl rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/5 bg-secondary/20 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notificaciones</h3>
            {notifications.length > 0 && (
                <button onClick={clearAll} className="text-[9px] font-bold text-destructive hover:underline uppercase tracking-tighter">Limpiar</button>
            )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          <AnimatePresence initial={false}>
            {notifications.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <Info className="w-6 h-6 text-muted-foreground/20" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <DropdownMenuItem 
                    key={notif.id} 
                    className={cn(
                        "p-4 border-b border-border/5 focus:bg-secondary/50 cursor-default flex items-start gap-3",
                        !notif.read && "bg-primary/5"
                    )}
                >
                  <div className={cn(
                    "p-2 rounded-lg mt-0.5",
                    notif.type === 'success' ? "bg-emerald-500/10 text-emerald-500" :
                    notif.type === 'error' ? "bg-destructive/10 text-destructive" : "bg-sky-500/10 text-sky-500"
                  )}>
                    {notif.type === 'success' && <CheckCircle2 className="w-3 h-3" />}
                    {notif.type === 'error' && <AlertCircle className="w-3 h-3" />}
                    {notif.type === 'info' && <Info className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-tight text-foreground">{notif.title}</p>
                    <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">{notif.message}</p>
                    <p className="text-[8px] font-bold text-muted-foreground/40 uppercase mt-1">
                        {notif.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </AnimatePresence>
        </div>
        {notifications.length > 0 && (
            <div className="p-3 bg-secondary/10 text-center">
                <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">Fin del historial</p>
            </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
