import { WhatsAppInstance } from '@/hooks/use-whatsapp-instances';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  MessageSquare, 
  Settings, 
  Trash2, 
  Power, 
  QrCode,
  ExternalLink,
  MoreVertical,
  Zap,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

interface InstanceCardProps {
  instance: WhatsAppInstance;
  onToggleBot: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onStart: (id: string, name: string) => void;
}

export const InstanceCard = ({ instance, onToggleBot, onDelete, onStart }: InstanceCardProps) => {
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'connected':
        return { label: 'Online', color: 'bg-emerald-500', text: 'text-emerald-500' };
      case 'qr_ready':
        return { label: 'Pendiente QR', color: 'bg-amber-500', text: 'text-amber-500' };
      case 'expired':
        return { label: 'Expirado', color: 'bg-destructive', text: 'text-destructive' };
      default:
        return { label: 'Desconectado', color: 'bg-muted-foreground/30', text: 'text-muted-foreground' };
    }
  };

  const status = getStatusDisplay(instance.status);

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.3 }}>
      <Card className="rounded-[32px] border-none bg-card overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 group">
        <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-5">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
              instance.platform === 'messenger' 
                ? "bg-[#0084FF]/10 text-[#0084FF]" 
                : (instance.status === 'connected' ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground/40")
            )}>
              {instance.platform === 'messenger' ? (
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0Zm1.191 14.963-3.056-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.888-3.26-6.558 6.963Z"/></svg>
              ) : (
                instance.status === 'connected' ? <Bot className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg font-black text-foreground truncate tracking-tight uppercase leading-tight">{instance.name}</CardTitle>
              <p className="text-[10px] text-muted-foreground/60 font-bold font-mono uppercase tracking-widest mt-1">
                  {instance.platform === 'messenger' ? (instance.external_id ? 'PÁGINA VINCULADA' : 'SIN VINCULAR') : (instance.phone_number || 'SIN VINCULAR')}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-secondary text-muted-foreground/60 group-hover:text-foreground transition-colors">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-[20px] border-none bg-popover shadow-2xl min-w-[180px] p-2">
              <DropdownMenuItem asChild className="rounded-xl focus:bg-secondary focus:text-foreground cursor-pointer">
                <Link to={`/instances/${instance.id}`} className="flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-widest text-foreground">
                  <ExternalLink className="w-4 h-4 text-primary" /> Detalles
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="rounded-xl focus:bg-destructive/10 focus:text-destructive text-destructive cursor-pointer flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-widest"
                onClick={() => onDelete(instance.id)}
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="px-8 py-6 space-y-8">
           <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/40 shadow-inner">
              <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full", status.color, instance.status === 'connected' && "animate-pulse")} />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", status.text)}>{status.label}</span>
              </div>
              <div className="flex items-center gap-3 bg-card/50 px-3 py-1.5 rounded-xl">
                  <Zap className={cn("w-3.5 h-3.5", instance.bot_enabled ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30")} />
                  <span className={cn("text-[10px] font-black tracking-widest", instance.bot_enabled ? "text-foreground" : "text-muted-foreground/40")}>
                      {instance.bot_enabled ? 'IA ON' : 'IA OFF'}
                  </span>
                  <Switch
                    checked={instance.bot_enabled}
                    onCheckedChange={(checked) => onToggleBot(instance.id, checked)}
                    className="scale-75 data-[state=checked]:bg-primary"
                  />
              </div>
           </div>

           <div className="flex justify-between px-2">
              <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[2px] mb-2">Alcance</span>
                  <span className="text-xs font-black text-foreground uppercase tracking-widest">{instance.scope || 'Global'}</span>
              </div>
              <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[2px] mb-2">Actividad</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground/40" />
                    <span className="text-xs font-black text-foreground tracking-widest">
                        {instance.last_connected_at ? new Date(instance.last_connected_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                    </span>
                  </div>
              </div>
           </div>
        </CardContent>

        <CardFooter className="px-8 pb-8 pt-2">
          {['disconnected', 'expired'].includes(instance.status) ? (
            <Button 
              className="w-full rounded-2xl font-black h-12 gap-3 bg-primary text-primary-foreground hover:scale-[1.02] transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
              onClick={() => onStart(instance.id, instance.name)}
            >
              <Power className="w-4 h-4" /> {instance.platform === 'messenger' ? 'Reconectar Webhook' : 'Iniciar Motor'}
            </Button>
          ) : instance.status === 'qr_ready' ? (
            <Button 
              className="w-full rounded-2xl font-black h-12 gap-3 bg-amber-500 hover:bg-amber-600 text-white uppercase text-[10px] tracking-widest shadow-lg shadow-amber-500/20"
              onClick={() => onStart(instance.id, instance.name)}
            >
              <QrCode className="w-4 h-4" /> Vincular WhatsApp
            </Button>
          ) : (
            <Button 
              variant="secondary" 
              className="w-full rounded-2xl font-black h-12 gap-3 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all uppercase text-[10px] tracking-widest shadow-sm"
              asChild
            >
              <Link to={`/instances/${instance.id}`}>
                <Settings className="w-4 h-4" /> Panel de Control
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};
