import { WhatsAppInstance } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { MoreVertical, MessageSquare, Trash2, ExternalLink, Power, Bot } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface InstanceCardProps {
  instance: WhatsAppInstance;
  onToggleBot: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  onRestart?: (id: string) => void;
}

export const InstanceCard = ({ instance, onToggleBot, onDelete, onRestart }: InstanceCardProps) => {
  const statusColors = {
    connected: 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]',
    disconnected: 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]',
    connecting: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    qr_ready: 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
    expired: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
  };

  const statusLabels = {
    connected: 'Conectado',
    disconnected: 'Desconectado',
    connecting: 'Conectando',
    qr_ready: 'QR Listo',
    expired: 'Expirado',
  };

  return (
    <Card className="nexus-card group relative overflow-hidden border-white/5 hover:border-amber-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/5 rounded-3xl p-1">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-4 rounded-2xl transition-all duration-500 border border-white/5 shadow-inner",
            instance.status === 'connected' ? "bg-amber-500/10 text-amber-500" : "bg-white/5 text-gray-500"
          )}>
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-lg font-black tracking-tight text-white uppercase italic">{instance.name}</CardTitle>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{instance.phone_number || 'Sin vincular'}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0d0e12] border-white/5 rounded-2xl shadow-2xl backdrop-blur-xl">
            <DropdownMenuItem asChild>
              <Link to={`/instances/${instance.id}`} className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 focus:text-white focus:bg-white/5 cursor-pointer">
                <ExternalLink className="w-4 h-4 text-amber-500" /> Ver Detalles
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-400 focus:text-red-300 focus:bg-red-400/5 flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest cursor-pointer"
              onClick={() => onDelete(instance.id)}
            >
              <Trash2 className="w-4 h-4" /> Eliminar Instancia
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-8 pt-2 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Estado Global</span>
            <Badge variant="outline" className={cn("capitalize px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest border-white/5", statusColors[instance.status])}>
              {statusLabels[instance.status]}
            </Badge>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">IA Automatizada</span>
            <div className="flex items-center gap-4">
              <span className={cn("text-[10px] font-black tracking-widest", instance.bot_enabled ? "text-amber-500" : "text-gray-600")}>
                {instance.bot_enabled ? 'SISTEMA ON' : 'SISTEMA OFF'}
              </span>
              <Switch
                checked={instance.bot_enabled}
                onCheckedChange={(checked) => onToggleBot(instance.id, checked)}
                className="data-[state=checked]:bg-amber-500 border-white/10"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 group-hover:bg-white/10 transition-colors">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Alcance de IA</p>
            <p className="text-xs font-black text-white uppercase tracking-tighter italic">
              {instance.scope === 'all' ? 'Red Completa' : instance.scope === 'groups' ? 'Grupos Logísticos' : 'Canal Específico'}
            </p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 group-hover:bg-white/10 transition-colors">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Prioridad</p>
            <p className="text-xs font-black text-white uppercase tracking-tighter italic">Alta Disponibilidad</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-6 relative z-10 flex flex-col gap-3">
        {instance.status === 'expired' || instance.status === 'disconnected' ? (
          <Button 
            onClick={() => onRestart?.(instance.id)}
            className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black text-[10px] tracking-[0.2em] border border-amber-400/50 transition-all uppercase group/btn"
          >
            <div className="flex items-center justify-center gap-3">
              Re-vincular Sesión
              <Power className="w-4 h-4 transition-transform group-hover/btn:rotate-12" />
            </div>
          </Button>
        ) : (
          <Button 
            asChild 
            className="w-full h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-[10px] tracking-[0.2em] border border-white/5 transition-all uppercase group/btn"
          >
            <Link to={`/instances/${instance.id}`} className="flex items-center justify-center gap-3">
              Acceder al Panel de Agente
              <ExternalLink className="w-4 h-4 text-amber-500 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};