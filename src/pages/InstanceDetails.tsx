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
  Target
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QRCodeModal } from '@/components/whatsapp/QRCodeModal';
import { ActivityLog } from '@/components/whatsapp/ActivityLog';
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
        toast.success(`Alcance actualizado a: ${scope}`);
    } catch (error: any) {
        toast.error('Error al actualizar alcance: ' + error.message);
    }
  };

  if (loading) return (
    <MainLayout>
        <div className="animate-pulse space-y-8 p-10">
            <div className="h-12 w-48 bg-white/5 rounded-xl" />
            <div className="h-96 bg-white/5 rounded-[48px]" />
        </div>
    </MainLayout>
  );

  if (!instance) return (
    <MainLayout>
        <div className="flex flex-col items-center justify-center py-40">
            <div className="bg-red-500/10 p-6 rounded-[32px] mb-6">
                <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Instancia no encontrada</h2>
            <Link to="/">
                <Button className="mt-8 bg-cyan-500 text-[#0f172a] font-bold px-8 h-12 rounded-2xl shadow-xl shadow-cyan-500/20">Volver al Panel</Button>
            </Link>
        </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white/5 p-6 rounded-[40px] border border-white/10 backdrop-blur-xl shadow-sm">
          <div className="flex items-center gap-6">
            <Link to="/">
                <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 shadow-sm transition-all group">
                    <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
                </Button>
            </Link>
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">{instance.name}</h1>
                <div className="flex items-center gap-3 mt-1.5">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        instance.status === 'connected' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-white/5 text-slate-500 border border-white/10"
                    )}>
                        <div className={cn("w-2 h-2 rounded-full", instance.status === 'connected' ? "bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-slate-600")} />
                        {instance.status === 'connected' ? 'Servicio Activo' : 'Offline'}
                    </div>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/10">
             <div className="flex flex-col items-end px-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Bot Enabled</span>
                <span className={cn("text-xs font-black", instance.bot_enabled ? "text-cyan-400" : "text-slate-500")}>
                    {instance.bot_enabled ? 'RESPUESTA IA ACTIVA' : 'RESPUESTA MANUAL'}
                </span>
             </div>
             <Switch 
                checked={instance.bot_enabled} 
                onCheckedChange={(checked) => toggleBot(instance.id, checked)}
                className="data-[state=checked]:bg-cyan-500"
             />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            <Card className="rounded-[48px] border-white/5 overflow-hidden bg-white/5 backdrop-blur-xl shadow-2xl">
               <CardHeader className="p-10 pb-6 bg-white/5">
                  <div className="flex items-center gap-5">
                     <div className="p-4 bg-cyan-500 rounded-3xl shadow-lg shadow-cyan-500/20">
                        <Brain className="w-8 h-8 text-[#0f172a]" />
                     </div>
                     <div>
                        <CardTitle className="text-2xl font-black text-white tracking-tight leading-none mb-1">Cerebro y Alcance</CardTitle>
                        <p className="text-base text-slate-400 font-medium">Configura quién responde y en qué conversaciones.</p>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-10 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[3px] ml-1">Agente IA</label>
                            <Select 
                                value={instance.agent_id || "none"} 
                                onValueChange={(val) => assignAgent(instance.id, val === "none" ? null : val)}
                            >
                                <SelectTrigger className="h-16 bg-white/5 border-2 border-white/10 rounded-3xl font-black text-white shadow-sm focus:ring-cyan-500/20">
                                    <SelectValue placeholder="Seleccionar agente..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-3xl border-white/10 shadow-2xl p-2 bg-[#0f172a] text-white">
                                    <SelectItem value="none" className="font-bold text-slate-500 py-3 rounded-2xl">🔴 Sin Agente</SelectItem>
                                    {agents.map(agent => (
                                        <SelectItem key={agent.id} value={agent.id} className="font-black py-3 rounded-2xl">✨ {agent.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[3px] ml-1">Alcance del Bot</label>
                            <Select 
                                defaultValue={instance.scope || "all"} 
                                onValueChange={(val: any) => updateScope(val)}
                            >
                                <SelectTrigger className="h-16 bg-white/5 border-2 border-white/10 rounded-3xl font-black text-white shadow-sm focus:ring-cyan-500/20">
                                    <SelectValue placeholder="Seleccionar alcance..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-3xl border-white/10 shadow-2xl p-2 bg-[#0f172a] text-white">
                                    <SelectItem value="all" className="font-black py-3 rounded-2xl">🌍 Todas las Conversaciones</SelectItem>
                                    <SelectItem value="groups" className="font-black py-3 rounded-2xl">👥 Solo Grupos</SelectItem>
                                    <SelectItem value="specific" className="font-black py-3 rounded-2xl">🎯 Solo Chats Individuales</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[3px] ml-1">Tienda Asignada</label>
                            <Select 
                                value={instance.store_id || "none"} 
                                onValueChange={(val) => assignStore(instance.id, val === "none" ? null : val)}
                            >
                                <SelectTrigger className="h-16 bg-white/5 border-2 border-white/10 rounded-3xl font-black text-white shadow-sm focus:ring-cyan-500/20">
                                    <SelectValue placeholder="Seleccionar tienda..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-3xl border-white/10 shadow-2xl p-2 bg-[#0f172a] text-white">
                                    <SelectItem value="none" className="font-bold text-slate-500 py-3 rounded-2xl">📦 Sin Tienda (Catálogo Global)</SelectItem>
                                    {stores.map(store => (
                                        <SelectItem key={store.id} value={store.id} className="font-black py-3 rounded-2xl">🏪 {store.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className={cn(
                            "p-6 rounded-[32px] border-2 transition-all h-full flex flex-col justify-center",
                            instance.store 
                                ? "bg-green-500/5 border-green-500/20" 
                                : "bg-orange-500/5 border-orange-500/20 border-dashed"
                        )}>
                             <div className="flex items-center gap-3 mb-3">
                                <Target className={cn("w-4 h-4", instance.store ? "text-green-500" : "text-orange-500")} />
                                <span className={cn("text-[10px] font-black uppercase tracking-widest", instance.store ? "text-green-500" : "text-orange-500")}>
                                    Contexto Operativo
                                </span>
                             </div>
                             <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                {instance.store 
                                    ? `Este bot opera bajo el catálogo de "${instance.store.name}".`
                                    : "⚠️ El bot usará todos los productos del workspace. Se recomienda asignar una tienda."}
                             </p>
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[4px] ml-10">Actividad en Tiempo Real</h3>
                <ActivityLog instanceId={instance.id} />
            </div>
          </div>

          <div className="space-y-8">
            <Card className="rounded-[48px] border-white/5 bg-white/5 backdrop-blur-xl shadow-lg overflow-hidden">
               <CardHeader className="p-8 border-b border-white/5 bg-white/5">
                  <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <Clock className="w-3 h-3" /> Resumen Operativo
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                   <div className="space-y-6">
                      <div className="flex justify-between">
                         <span className="text-xs font-bold text-slate-500">Instancia Activa</span>
                         <span className="text-xs font-black text-white uppercase">{instance.id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-xs font-bold text-slate-500">Última Conexión</span>
                         <span className="text-xs font-black text-cyan-400">
                            {instance.last_connected_at ? new Date(instance.last_connected_at).toLocaleString() : 'Nunca'}
                         </span>
                      </div>
                   </div>

                   <div className="flex flex-col gap-4">
                      {instance.status === 'connected' && (
                        <Link to={`/instances/${instance.id}/web`}>
                          <Button className="w-full h-14 rounded-3xl font-black bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 gap-3 uppercase text-xs tracking-widest">
                             <MessageSquare className="w-5 h-5" /> Abrir WhatsApp WebAI
                          </Button>
                        </Link>
                      )}
                      
                      {['disconnected', 'expired'].includes(instance.status) ? (
                        <Button 
                          className="w-full h-14 rounded-3xl font-black bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] shadow-lg shadow-cyan-500/20 gap-3 uppercase text-xs tracking-widest"
                          onClick={() => { startInstance(instance.id, instance.name); setIsModalOpen(true); }}
                        >
                          <QrCode className="w-5 h-5" /> Vincular Dispositivo
                        </Button>
                      ) : instance.status === 'qr_ready' ? (
                        <Button 
                          className="w-full h-14 rounded-3xl font-black bg-orange-500 hover:bg-orange-400 text-[#0f172a] shadow-lg shadow-orange-500/20 gap-3 uppercase text-xs tracking-widest"
                          onClick={() => setIsModalOpen(true)}
                        >
                          <QrCode className="w-5 h-5" /> Mostrar Código QR
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full h-14 rounded-3xl font-black border-2 border-white/10 text-slate-400 hover:bg-white/5 hover:text-white gap-3 uppercase text-xs tracking-widest"
                          onClick={() => startInstance(instance.id, instance.name)}
                        >
                          <History className="w-5 h-5" /> Reiniciar Motor
                        </Button>
                      )}
                   </div>
               </CardContent>
            </Card>

            <Card className="rounded-[40px] border-red-500/20 bg-red-500/5 shadow-none overflow-hidden border">
               <CardHeader className="p-8">
                  <CardTitle className="text-xs font-black text-red-500 uppercase tracking-widest">Zona Crítica</CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-6">
                  <p className="text-xs text-red-400/60 font-medium leading-relaxed">
                     Esta acción eliminará permanentemente la instancia y cerrará la sesión de WhatsApp.
                  </p>
                  <Button 
                    variant="destructive" 
                    className="w-full h-12 rounded-2xl font-black bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 gap-3 uppercase text-xs tracking-widest"
                    onClick={() => {
                        if (confirm('¿Confirmas la eliminación definitiva?')) {
                            deleteInstance(instance.id);
                            window.location.href = '/';
                        }
                    }}
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar Instancia
                  </Button>
               </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <QRCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addInstance}
        instances={instances}
        initialInstance={{ id: instance.id, name: instance.name }}
      />
    </MainLayout>
  );
};

export default InstanceDetails;