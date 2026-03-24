"use client";

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useInstances } from '@/hooks/use-instances';
import { useGlobalSettings } from '@/hooks/use-global-settings';
import { useChatLogs } from '@/hooks/use-chat-logs';
import { ChatModal } from '@/components/whatsapp/ChatModal';
import { PersonalityModal } from '@/components/whatsapp/PersonalityModal';
import { QRCodeModal } from '@/components/whatsapp/QRCodeModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  MessageSquare, 
  Settings, 
  Activity, 
  History, 
  Bot, 
  Shield, 
  Trash2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  QrCode,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, Agent } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const InstanceDetails = () => {
  const { id } = useParams();
  const { instances, toggleBot, deleteInstance, loading, socket, sendMessage, changeScope, restartInstance, updateInstance, runConnectivityTest, startLinking } = useInstances();
  const { settings } = useGlobalSettings();
  const { logs } = useChatLogs(id);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPersonalityModalOpen, setIsPersonalityModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const instance = instances.find(i => i.id === id);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await api.getAgents();
        setAgents(data);
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };
    fetchAgents();
  }, []);

  const handleShowQR = () => {
    if (instance?.status === 'expired' || instance?.status === 'disconnected') {
      restartInstance(instance.id);
    }
    setIsQRModalOpen(true);
  };

  const handleSavePersonality = async (newPersonality: string) => {
    if (instance) {
      await updateInstance(instance.id, { personality: newPersonality });
    }
    setIsPersonalityModalOpen(false);
  };

  const handleAgentChange = async (agentId: string) => {
    if (instance) {
      await updateInstance(instance.id, { agent_id: agentId });
    }
  };

  if (loading) return <MainLayout><div className="animate-pulse space-y-8"><div className="h-12 w-48 bg-accent rounded-xl" /><div className="h-64 bg-accent rounded-3xl" /></div></MainLayout>;
  if (!instance) return <MainLayout><div className="text-center py-20"><h2 className="text-2xl font-bold">Instancia no encontrada</h2><Link to="/"><Button className="mt-4">Volver al Panel</Button></Link></div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-accent">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{instance.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="rounded-full px-3 py-0.5 font-bold bg-primary/5">
                  {instance.phone_number || 'Sin vincular'}
                </Badge>
                <div className="flex items-center gap-1.5 ml-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full", 
                    instance.status === 'connected' ? "bg-green-500" : 
                    instance.status === 'expired' ? "bg-rose-500 animate-pulse" : "bg-red-500"
                  )} />
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-widest",
                    instance.status === 'expired' ? "text-rose-500" : "text-muted-foreground"
                  )}>
                    {instance.status === 'connected' ? 'Conectado' : 
                     instance.status === 'expired' ? 'Re-vinculación requerida' : 
                     instance.status === 'qr_ready' ? 'Esperando Escaneo' : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {instance.status === 'connected' && (
            <Button 
              onClick={() => setIsChatOpen(true)}
              className="rounded-2xl h-12 px-6 font-bold gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20"
            >
              <MessageSquare className="w-5 h-5" /> Abrir WhatsApp Web
            </Button>
          )}

          {(instance.status === 'qr_ready' || instance.status === 'expired' || instance.status === 'disconnected') && (
            <Button 
              onClick={handleShowQR}
              className="rounded-2xl h-12 px-8 font-black gap-3 bg-amber-500 hover:bg-amber-600 text-black shadow-xl shadow-amber-500/10 uppercase tracking-widest text-xs"
            >
              <QrCode className="w-5 h-5" /> {instance.status === 'qr_ready' ? 'Ver Código QR' : 'Re-vincular WhatsApp'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[32px] border-border/50 overflow-hidden shadow-sm">
              <CardHeader className="bg-accent/30 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-bold">Configuración del Bot</CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground">Bot Activo</span>
                    <Switch 
                      checked={instance.bot_enabled} 
                      onCheckedChange={(checked) => toggleBot(instance.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Agente Asignado</label>
                    <Select 
                      value={instance.agent_id}
                      onValueChange={handleAgentChange}
                    >
                      <SelectTrigger className="rounded-xl font-bold h-10 bg-white/5 border-white/10">
                        <SelectValue placeholder="Seleccionar Agente" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d0e12] border-white/10 text-white rounded-xl">
                        {agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id}>
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-purple-500" />
                              {agent.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Personalidad Rápida (Legacy)</label>
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl font-bold justify-between h-10 border-white/10"
                      onClick={() => setIsPersonalityModalOpen(true)}
                    >
                      <span className="truncate">{instance.personality ? 'Personalizada' : 'Default'}</span>
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Alcance de Respuesta</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'all', label: 'Todos' },
                        { id: 'groups', label: 'Grupos' },
                        { id: 'specific', label: 'Específicos' }
                      ].map((scope) => (
                        <Button 
                          key={scope.id}
                          variant={instance.scope === scope.id ? 'default' : 'outline'}
                          className="rounded-xl font-bold h-10 border-white/10"
                          size="sm"
                          onClick={() => changeScope(instance.id, scope.id as any)}
                        >
                          {scope.label}
                        </Button>
                      ))}
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-accent/30 border border-border/50 space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Shield className="w-5 h-5" />
                    <h4 className="font-bold">Controles de Seguridad</h4>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                    El bot solo responderá a consultas de productos basadas en tus datos de ecommerce. No participará en conversaciones fuera de tema.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-border/50 overflow-hidden shadow-sm">
              <CardHeader className="bg-accent/30 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-bold">Actividad Reciente</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
                  {logs.length > 0 ? logs.map((log, idx) => (
                    <div key={idx} className="p-4 flex items-start gap-4 hover:bg-accent/20 transition-colors">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        log.type === 'bot' ? "bg-primary/10 text-primary" : "bg-accent text-muted-foreground"
                      )}>
                        {log.type === 'bot' ? <Bot className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold truncate max-w-[150px]">{log.sender_name || 'Desconocido'}</span>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Ahora'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground line-clamp-2">{log.text}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-muted-foreground font-medium">
                      No hay actividad registrada aún.
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full rounded-none h-12 font-bold text-primary hover:bg-primary/5"
                  onClick={() => setIsChatOpen(true)}
                >
                  Ver en Chat en Vivo
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="rounded-[32px] border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Estado del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Conexión</span>
                  <Badge className={cn(
                    "rounded-full border",
                    instance.status === 'connected' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                    instance.status === 'expired' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : 
                    "bg-red-500/10 text-red-500 border-red-500/20"
                  )}>
                    {instance.status === 'connected' ? 'Estable' : 
                     instance.status === 'expired' ? 'Fallida' : 'Inactiva'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Tiempo de actividad</span>
                  <span className="text-sm font-bold">99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Latencia</span>
                  <span className="text-sm font-bold">142ms</span>
                </div>
                <div className="pt-4 border-t border-border/50 space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl font-bold h-11 gap-2 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                    onClick={() => runConnectivityTest(instance.id)}
                    disabled={instance.status !== 'connected'}
                  >
                    <Activity className="w-4 h-4" /> Diagnosticar Conexión
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full rounded-xl font-bold h-11 gap-2"
                    onClick={() => restartInstance(instance.id)}
                  >
                    <History className="w-4 h-4" /> Reiniciar Sesión
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] border-destructive/20 bg-destructive/5 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-destructive">Zona de Peligro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs font-medium text-destructive/80 leading-relaxed">
                  Eliminar esta instancia borrará permanentemente todos los datos de sesión y configuraciones del bot. Esta acción no se puede deshacer.
                </p>
                <Button 
                  variant="destructive" 
                  className="w-full rounded-xl font-bold h-11 gap-2"
                  onClick={() => {
                    if (confirm('¿Estás seguro de que quieres eliminar esta instancia?')) {
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

      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        instanceId={instance.id}
        instanceName={instance.name}
        socket={socket}
        onSendMessage={sendMessage}
      />

      <PersonalityModal
        isOpen={isPersonalityModalOpen}
        onClose={() => setIsPersonalityModalOpen(false)}
        currentPersonality={instance.personality || ''}
        globalPersonality={settings.personality || ''}
        onSave={handleSavePersonality}
      />

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onStartLinking={startLinking}
        socket={socket}
        instanceId={instance.id}
        onSuccess={() => setIsQRModalOpen(false)}
      />
    </MainLayout>
  );
};

export default InstanceDetails;