"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { socket } from '@/lib/socket';
import { 
  Hash, 
  Trash2, 
  PlusCircle, 
  ShieldCheck, 
  Activity,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  RefreshCw,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { sileo as toast } from 'sileo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ControlChannelsListProps {
  instanceId: string;
}

export const ControlChannelsList = ({ instanceId }: ControlChannelsListProps) => {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [newChannelJid, setNewChannelJid] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('control_channels')
        .select('*')
        .eq('instance_id', instanceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChannels(data || []);
    } catch (error: any) {
      console.error('Error fetching channels:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestGroups = () => {
    setLoadingGroups(true);
    socket.emit('request-groups', { instanceId });
  };

  useEffect(() => {
    fetchChannels();
    
    // Registrar el socket para esta instancia específica
    socket.emit('register-instance', { instanceId });

    const handleGroupsList = (data: { groups: any[] }) => {
        console.log("Grupos recibidos:", data.groups);
        setAvailableGroups(data.groups);
        setLoadingGroups(false);
    };

    socket.on('groups-list', handleGroupsList);

    return () => {
        socket.off('groups-list', handleGroupsList);
    };
  }, [instanceId]);

  const handleAddChannel = async () => {
    if (!newChannelJid || !newChannelName) {
      toast.error("Por favor completa todos los campos.");
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('control_channels')
        .upsert({
          instance_id: instanceId,
          external_id: newChannelJid,
          name: newChannelName,
          is_active: true
        }, { onConflict: 'instance_id,external_id' });

      if (error) throw error;
      
      toast.success("Canal de control vinculado.");
      setNewChannelJid("");
      setNewChannelName("");
      fetchChannels();
    } catch (error: any) {
      toast.error("Error al vincular: " + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleChannelStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('control_channels')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchChannels();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const deleteChannel = async (id: string) => {
    if (!confirm("¿Seguro que deseas desvincular este canal? El bot dejará de escuchar comandos aquí.")) return;
    
    try {
      const { error } = await supabase
        .from('control_channels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchChannels();
      toast.success("Canal desvinculado.");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-[40px] p-10 space-y-8 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl shadow-[0_0_15px_-5px_rgba(249,115,22,0.4)]">
                    <ShieldCheck className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Vincular Canal</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Nodos de control para comandos remotos.</p>
                </div>
            </div>
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={requestGroups}
                disabled={loadingGroups}
                className="h-10 px-4 rounded-xl text-primary hover:bg-primary/10 gap-2 border border-primary/10"
            >
                {loadingGroups ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span className="text-[10px] font-black uppercase tracking-widest">Sincronizar Grupos</span>
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[3px] ml-2">Seleccionar Grupo de WhatsApp</label>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full h-14 bg-secondary/50 border-border rounded-2xl text-foreground justify-between font-bold text-xs overflow-hidden px-5 group hover:bg-secondary transition-all">
                        <span className="truncate uppercase tracking-tight">{newChannelJid || "Elegir un grupo..."}</span>
                        <ChevronDown className="w-4 h-4 opacity-50 shrink-0 group-hover:text-primary transition-colors" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[340px] bg-popover backdrop-blur-2xl border-border rounded-[32px] shadow-2xl p-3 max-h-[400px] overflow-y-auto space-y-1">
                    {availableGroups.length === 0 && !loadingGroups && (
                        <div className="p-8 text-center space-y-3">
                            <Users className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed">No hay grupos disponibles.<br/>Sincroniza tu WhatsApp primero.</p>
                        </div>
                    )}
                    {availableGroups.map((group) => (
                        <DropdownMenuItem 
                            key={group.id} 
                            onClick={() => {
                                setNewChannelJid(group.id);
                                if (!newChannelName) setNewChannelName(group.subject);
                            }}
                            className="rounded-2xl focus:bg-accent p-4 cursor-pointer flex flex-col items-start gap-1.5 transition-all"
                        >
                            <span className="font-black text-foreground text-xs uppercase tracking-tight">{group.subject}</span>
                            <span className="text-[9px] text-muted-foreground font-mono tracking-tighter bg-background px-2 py-0.5 rounded-md">{group.id}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="space-y-3">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[3px] ml-2">Alias de Sucursal / Canal</label>
            <Input 
              placeholder="SUCURSAL CENTRO" 
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              className="h-14 bg-secondary/50 border-border rounded-2xl text-foreground font-bold text-xs uppercase tracking-widest placeholder:text-muted-foreground/30 px-5 focus:ring-primary/20 focus:border-primary/30"
            />
          </div>
        </div>
        
        <Button 
          onClick={handleAddChannel} 
          disabled={isAdding || !newChannelJid || !newChannelName}
          className="w-full h-14 bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 text-primary-foreground font-black rounded-2xl transition-all shadow-xl shadow-primary/20 uppercase text-[11px] tracking-[3px] gap-3 ai-glow-hover"
        >
          {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
          Vincular Canal de Control
        </Button>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[4px] ml-6">Canales Vinculados</h4>
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin opacity-50" />
          </div>
        ) : channels.length === 0 ? (
          <div className="text-center py-20 bg-card border-2 border-dashed border-border rounded-[40px]">
             <AlertCircle className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
             <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[3px]">Sin canales operativos.</p>
          </div>
        ) : (
          channels.map((channel) => (
            <div key={channel.id} className="bg-card border border-border p-6 rounded-[32px] flex items-center justify-between group relative overflow-hidden shadow-sm">
              <div className="absolute inset-y-0 left-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                  channel.is_active ? "bg-primary/20 text-primary ai-glow" : "bg-secondary text-muted-foreground"
                )}>
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-foreground uppercase text-base tracking-tight">{channel.name}</h4>
                  <p className="text-[10px] font-mono text-muted-foreground tracking-tighter mt-1">{channel.external_id}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Badge 
                  onClick={() => toggleChannelStatus(channel.id, channel.is_active)}
                  variant="outline" 
                  className={cn(
                    "cursor-pointer text-[9px] font-black uppercase px-4 py-1.5 rounded-xl border-none transition-all shadow-sm",
                    channel.is_active ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  )}
                >
                  {channel.is_active ? 'Online' : 'Pausado'}
                </Badge>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteChannel(channel.id)}
                  className="h-12 w-12 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
