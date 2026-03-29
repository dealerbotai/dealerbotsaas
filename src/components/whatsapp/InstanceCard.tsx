import { WhatsAppInstance } from '@/hooks/use-whatsapp-instances';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { MoreVertical, MessageSquare, Trash2, ExternalLink, Power, Bot, Activity, Settings, QrCode, Zap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface InstanceCardProps {
  instance: WhatsAppInstance;
  onToggleBot: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onStart: (id: string, name: string) => void;
}

export const InstanceCard = ({ instance, onToggleBot, onDelete, onStart }: InstanceCardProps) => {
  const statusConfig = {
    connected: { color: 'bg-cyan-400', label: 'En Línea', bg: 'bg-cyan-400/10', text: 'text-cyan-400' },
    disconnected: { color: 'bg-slate-400', label: 'Offline', bg: 'bg-slate-400/10', text: 'text-slate-300' },
    connecting: { color: 'bg-blue-400 animate-pulse', label: 'Conectando', bg: 'bg-blue-400/10', text: 'text-blue-300' },
    qr_ready: { color: 'bg-orange-400 animate-pulse', label: 'QR Listo', bg: 'bg-orange-400/10', text: 'text-orange-300' },
    loading: { color: 'bg-slate-500', label: 'Cargando', bg: 'bg-slate-500/10', text: 'text-slate-400' },
    expired: { color: 'bg-red-400', label: 'Expirado', bg: 'bg-red-400/10', text: 'text-red-300' },
    initializing: { color: 'bg-amber-400 animate-pulse', label: 'Iniciando', bg: 'bg-amber-400/10', text: 'text-amber-300' }
  };

  const status = statusConfig[instance.status] || statusConfig.disconnected;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card group relative overflow-hidden"
    >
      <CardHeader className="flex flex-row items-center justify-between pb-6 space-x-4">
        <div className="flex items-center gap-5">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
            instance.status === 'connected' ? "bg-cyan-500/20 text-cyan-400 ai-glow" : "bg-white/10 text-slate-400"
          )}>
            {instance.status === 'connected' ? <Bot className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
          </div>
          <div className="min-w-0">
            <CardTitle className="text-lg font-black text-white truncate tracking-tight uppercase">{instance.name}</CardTitle>
            <p className="text-[10px] text-slate-300 font-black font-mono uppercase tracking-widest mt-1">
                {instance.phone_number || 'SIN VINCULAR'}
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-white/10 text-slate-300">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl border-white/10 bg-[#0f172a] shadow-2xl min-w-[180px] p-2">
            <DropdownMenuItem asChild className="rounded-xl focus:bg-white/10 focus:text-white cursor-pointer">
              <Link to={`/instances/${instance.id}`} className="flex items-center gap-3 p-2.5 text-xs font-bold uppercase tracking-widest text-slate-200">
                <ExternalLink className="w-4 h-4 text-cyan-400" /> Detalles
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="rounded-xl focus:bg-red-500/20 focus:text-red-400 text-red-400 cursor-pointer flex items-center gap-3 p-2.5 text-xs font-bold uppercase tracking-widest"
              onClick={() => onDelete(instance.id)}
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-8 pt-2">
         <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
                <div className={cn("w-2.5 h-2.5 rounded-full", status.color, instance.status === 'connected' && "ai-glow")} />
                <span className={cn("text-[10px] font-black uppercase tracking-[2px]", status.text)}>{status.label}</span>
            </div>
            <div className="flex items-center gap-3 bg-slate-950/50 px-3 py-1.5 rounded-xl border border-white/10">
                <Zap className={cn("w-3 h-3", instance.bot_enabled ? "text-orange-400" : "text-slate-500")} />
                <span className={cn("text-[9px] font-black tracking-widest", instance.bot_enabled ? "text-white" : "text-slate-400")}>
                    {instance.bot_enabled ? 'AI ON' : 'AI OFF'}
                </span>
                <Switch
                  checked={instance.bot_enabled}
                  onCheckedChange={(checked) => onToggleBot(instance.id, checked)}
                  className="scale-75 data-[state=checked]:bg-cyan-500"
                />
            </div>
         </div>

         <div className="flex justify-between px-2">
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-2">Alcance</span>
                <span className="text-xs font-black text-white uppercase tracking-widest">{instance.scope || 'Todos'}</span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-2">Última Actividad</span>
                <span className="text-xs font-black text-white tracking-widest">
                    {instance.last_connected_at ? new Date(instance.last_connected_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                </span>
            </div>
         </div>
      </CardContent>

      <CardFooter className="pt-4">
        {['disconnected', 'expired'].includes(instance.status) ? (
          <Button 
            className="w-full rounded-2xl font-black h-12 gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white uppercase text-xs tracking-widest ai-glow-hover"
            onClick={() => onStart(instance.id, instance.name)}
          >
            <Power className="w-4 h-4" /> Iniciar Motor
          </Button>
        ) : instance.status === 'qr_ready' ? (
          <Button 
            className="w-full rounded-2xl font-black h-12 gap-3 bg-orange-500 hover:bg-orange-400 text-[#0f172a] uppercase text-xs tracking-widest ai-glow-hover"
            onClick={() => onStart(instance.id, instance.name)}
          >
            <QrCode className="w-4 h-4" /> Escanear QR
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="w-full rounded-2xl font-black h-12 gap-3 border-white/20 text-slate-200 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all uppercase text-xs tracking-widest"
            asChild
          >
            <Link to={`/instances/${instance.id}`}>
              <Settings className="w-4 h-4" /> Configuración
            </Link>
          </Button>
        )}
      </CardFooter>
    </motion.div>
  );
};