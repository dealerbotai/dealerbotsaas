"use client";

import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  MessageSquare, 
  History, 
  Shield, 
  Trash2,
  Clock,
  QrCode,
  Brain,
  AlertCircle,
  Store as StoreIcon,
  Target,
  Zap,
  Settings,
  Cpu,
  Globe,
  Layout
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddChannelModal } from '@/components/whatsapp/AddChannelModal';
import { ActivityLog } from '@/components/whatsapp/ActivityLog';
import { ControlChannelsList } from '@/components/whatsapp/ControlChannelsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const InstanceDetails = () => {
  const { id } = useParams();
  const { instances, agents, stores, toggleBot, deleteInstance, startInstance, addInstance, assignAgent, assignStore, loading } = useWhatsApp();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const instance = instances.find(i => i.id === id);

  const updateScope = async (scope: 'all' | 'groups' | 'specific') => {
    if (!id) return;
    try {
        const { error } = await supabase
            .from('instances')
            .update({ scope })
            .eq('id', id);

        if (error) throw error;
        toast.success(`Alcance actualizado.`);
    } catch (error: any) {
        toast.error('Error: ' + error.message);
    }
  };

  if (loading) return (
    <MainLayout>
        <div className="animate-pulse space-y-8 p-10">
            <div className="h-12 w-48 bg-secondary rounded-2xl" />
            <div className="h-96 bg-secondary rounded-[32px]" />
        </div>
    </MainLayout>
  );

  if (!instance) return (
    <MainLayout>
        <div className="flex flex-col items-center justify-center py-40">
            <div className="bg-destructive/10 p-6 rounded-[32px] mb-6 border border-destructive/20">
                <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Instancia no encontrada</h2>
            <Link to="/">
                <Button className="mt-8 bg-primary text-primary-foreground font-black px-8 h-12 rounded-2xl shadow-xl shadow-primary/20 uppercase text-xs tracking-widest">Volver al Panel</Button>
            </Link>
        </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Compacto y Elegante */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-card p-5 rounded-[32px] border border-border shadow-sm">
          <div className="flex items-center gap-5">
            <Link to="/">
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-secondary hover:bg-accent text-muted-foreground hover:text-primary transition-all">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
            </Link>
            <div>
                <h1 className="text-xl font-black text-foreground tracking-tight uppercase flex items-center gap-3">
                    {instance.name}
                    {instance.status === 'connected' && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />}
                </h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px] mt-0.5">ID: {instance?.id?.slice(0,8) || '----'} • {instance.status}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-secondary/50 p-2 rounded-2xl border border-border">
             <div className="px-3 text-right">
                <p className={cn("text-[9px] font-black uppercase tracking-widest", instance.bot_enabled ? "text-primary" : "text-muted-foreground")}>
                    {instance.bot_enabled ? 'IA Activa' : 'Manual'}
                </p>
             </div>
             <Switch 
                checked={instance.bot_enabled} 
                onCheckedChange={(checked) => toggleBot(instance.id, checked)}
                className="data-[state=checked]:bg-primary scale-90"
             />
          </div>
        </div>

        <Tabs defaultValue="config" className="space-y-6">
            <TabsList className="bg-secondary/50 p-1 rounded-2xl h-12 border border-border inline-flex">
                <TabsTrigger value="config" className="rounded-xl px-5 font-black uppercase text-[9px] tracking-[2px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2">
                    <Settings className="w-3.5 h-3.5" /> Config
                </TabsTrigger>
                <TabsTrigger value="channels" className="rounded-xl px-5 font-black uppercase text-[9px] tracking-[2px] data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all gap-2">
                    <Shield className="w-3.5 h-3.5" /> Canales
                </TabsTrigger>
                <TabsTrigger value="commands" className="rounded-xl px-5 font-black uppercase text-[9px] tracking-[2px] data-[state=active]:bg-accent data-[state=active]:text-foreground transition-all gap-2">
                    <Zap className="w-3.5 h-3.5" /> Comandos
                </TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="outline-none space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        
                        <Card className="rounded-[32px] border-border bg-card shadow-xl overflow-hidden">
                            <CardContent className="p-8 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Cpu className="w-3 h-3 text-primary" />
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Motor de IA</label>
                                            </div>
                                            <Select 
                                                value={instance.agent_id || "none"} 
                                                onValueChange={(val) => assignAgent(instance.id, val === "none" ? null : val)}
                                            >
                                                <SelectTrigger className="h-12 bg-secondary/50 border-border rounded-xl font-bold text-foreground shadow-sm focus:ring-primary/20 transition-all text-xs">
                                                    <SelectValue placeholder="Elegir Agente..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border shadow-2xl bg-popover text-popover-foreground">
                                                    <SelectItem value="none" className="font-bold text-muted-foreground py-2">Sin Agente</SelectItem>
                                                    {agents.map(agent => (
                                                        <SelectItem key={agent.id} value={agent.id} className="font-bold py-2">✨ {agent.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Globe className="w-3 h-3 text-primary" />
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Alcance de Respuesta</label>
                                            </div>
                                            <Select 
                                                defaultValue={instance.scope || "all"} 
                                                onValueChange={(val: any) => updateScope(val)}
                                            >
                                                <SelectTrigger className="h-12 bg-secondary/50 border-border rounded-xl font-bold text-foreground shadow-sm focus:ring-primary/20 transition-all text-xs">
                                                    <SelectValue placeholder="Alcance..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border shadow-2xl bg-popover text-popover-foreground">
                                                    <SelectItem value="all" className="font-bold py-2 text-xs">🌍 Todas las Conversaciones</SelectItem>
                                                    <SelectItem value="groups" className="font-bold py-2 text-xs">👥 Solo Grupos</SelectItem>
                                                    <SelectItem value="specific" className="font-bold py-2 text-xs">🎯 Solo Chats Directos</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <StoreIcon className="w-3 h-3 text-primary" />
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tienda / Sucursal</label>
                                            </div>
                                            <Select 
                                                value={instance.store_id || "none"} 
                                                onValueChange={(val) => assignStore(instance.id, val === "none" ? null : val)}
                                            >
                                                <SelectTrigger className="h-12 bg-secondary/50 border-border rounded-xl font-bold text-foreground shadow-sm focus:ring-primary/20 transition-all text-xs">
                                                    <SelectValue placeholder="Tienda..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border shadow-2xl bg-popover text-popover-foreground">
                                                    <SelectItem value="none" className="font-bold text-muted-foreground py-2 text-xs">Catálogo Global</SelectItem>
                                                    {stores.map(store => (
                                                        <SelectItem key={store.id} value={store.id} className="font-bold py-2 text-xs">🏪 {store.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className={cn(
                                            "p-4 rounded-2xl border transition-all h-[100px] flex flex-col justify-center",
                                            instance.store ? "bg-green-500/5 border-green-500/10" : "bg-orange-500/5 border-orange-500/10 border-dashed"
                                        )}>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Target className={cn("w-3 h-3", instance.store ? "text-green-500" : "text-orange-500")} />
                                                <span className={cn("text-[8px] font-black uppercase tracking-widest", instance.store ? "text-green-500" : "text-orange-500")}>Operación</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground font-medium leading-tight">
                                                {instance.store ? `Operando con "${instance.store.name}".` : "Asigna una tienda para filtrar el catálogo."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[3px] ml-4">Monitor de Actividad</h3>
                            <ActivityLog instanceId={instance.id} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="rounded-[32px] border-border bg-card shadow-lg overflow-hidden">
                            <CardHeader className="p-6 border-b border-border bg-secondary/30">
                                <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-[3px] flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Estado de Sesión
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-secondary/50 p-3 rounded-xl">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Motor</span>
                                        <Badge className={cn("text-[9px] font-black border-none px-2.5 py-0.5", 
                                            instance.status === 'connected' ? "bg-green-500/20 text-green-500" : "bg-destructive/20 text-destructive"
                                        )}>
                                            {instance.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Visto</span>
                                        <span className="text-[10px] font-black text-foreground uppercase">
                                            {instance.last_connected_at ? new Date(instance.last_connected_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Offline'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-border">
                                    {instance.status === 'connected' && instance.platform !== 'messenger' && (
                                        <Link to={`/instances/${instance.id}/web`}>
                                            <Button className="w-full h-11 rounded-xl font-black bg-secondary hover:bg-accent text-foreground border border-border gap-3 uppercase text-[10px] tracking-widest transition-all">
                                                <MessageSquare className="w-4 h-4 text-primary" /> WhatsApp Mirror
                                            </Button>
                                        </Link>
                                    )}
                                    
                                    <Button 
                                        className={cn(
                                            "w-full h-11 rounded-xl font-black gap-3 uppercase text-[10px] tracking-widest transition-all shadow-lg",
                                            instance.status === 'connected' 
                                                ? "bg-secondary border border-border text-muted-foreground hover:bg-accent"
                                                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
                                        )}
                                        onClick={() => { startInstance(instance.id, instance.name); if (['disconnected', 'expired', 'qr_ready'].includes(instance.status)) setIsModalOpen(true); }}
                                    >
                                        {instance.status === 'connected' ? <History className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                                        {instance.status === 'connected' ? 'Reiniciar Motor' : (instance.platform === 'messenger' ? 'Vincular Messenger' : 'Vincular WhatsApp')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[32px] border-destructive/10 bg-destructive/5 shadow-none overflow-hidden border">
                            <CardContent className="p-6 space-y-4">
                                <p className="text-[9px] text-destructive/60 font-black uppercase tracking-widest">Zona de Peligro</p>
                                <Button 
                                    variant="ghost" 
                                    className="w-full h-10 rounded-xl font-black hover:bg-destructive/10 text-destructive/50 hover:text-destructive transition-all uppercase text-[9px] tracking-widest gap-2"
                                    onClick={() => {
                                        if (confirm('¿Eliminar definitivamente?')) {
                                            deleteInstance(instance.id);
                                            window.location.href = '/';
                                        }
                                    }}
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Borrar Instancia
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="channels" className="outline-none">
                <div className="max-w-4xl mx-auto">
                    <ControlChannelsList instanceId={instance.id} />
                </div>
            </TabsContent>

            <TabsContent value="commands" className="outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <CommandInfo 
                        cmd="!vincular_canal" 
                        desc="Convierte el grupo en Canal de Control." 
                        example="!vincular_canal Sucursal Centro"
                    />
                    <CommandInfo 
                        cmd="!venta" 
                        desc="Registra pedido para despacho." 
                        example="!venta 500 Pizza | Calle 10 #5"
                        highlight
                    />
                    <CommandInfo cmd="!inicio" desc="Resumen IA y motivación diaria." />
                    <CommandInfo cmd="!cierre" desc="Reporte de ventas en vivo." />
                    <CommandInfo cmd="!cancelar" desc="Anula pedido y descuenta métricas." />
                </div>
            </TabsContent>
        </Tabs>
      </div>
      
      <AddChannelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addInstance}
        instances={instances}
        initialInstance={{ id: instance.id, name: instance.name }}
      />
    </MainLayout>
  );
};

const CommandInfo = ({ cmd, desc, example, highlight }: any) => (
    <div className={cn(
        "p-6 rounded-[28px] border transition-all flex flex-col justify-between h-full",
        highlight ? "bg-primary/10 border-primary/20 shadow-lg shadow-primary/5" : "bg-card border-border"
    )}>
        <div>
            <code className="text-sm font-black text-foreground block mb-2">{cmd}</code>
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed mb-4">{desc}</p>
        </div>
        {example && (
            <div className="mt-auto p-2.5 bg-secondary rounded-xl border border-border">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Ejemplo</p>
                <code className="text-[9px] text-primary/80 font-mono break-all">{example}</code>
            </div>
        )}
    </div>
);

export default InstanceDetails;
