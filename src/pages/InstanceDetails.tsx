"use client";

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
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
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const InstanceDetails = () => {
  const { id } = useParams();
  const { instances, toggleBot, deleteInstance, loading } = useWhatsApp();
  const instance = instances.find(i => i.id === id);

  if (loading) return <MainLayout><div className="animate-pulse space-y-8"><div className="h-12 w-48 bg-accent rounded-xl" /><div className="h-64 bg-accent rounded-3xl" /></div></MainLayout>;
  if (!instance) return <MainLayout><div className="text-center py-20"><h2 className="text-2xl font-bold">Instancia no encontrada</h2><Link to="/"><Button className="mt-4">Volver al Panel</Button></Link></div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-8">
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
                {instance.phoneNumber || 'Sin vincular'}
              </Badge>
              <div className="flex items-center gap-1.5 ml-2">
                <div className={cn("w-2 h-2 rounded-full", instance.status === 'connected' ? "bg-green-500" : "bg-red-500")} />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {instance.status === 'connected' ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>
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
                      checked={instance.botEnabled} 
                      onCheckedChange={(checked) => toggleBot(instance.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          className="rounded-xl font-bold h-10"
                          size="sm"
                        >
                          {scope.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Personalidad de IA</label>
                    <Button variant="outline" className="w-full rounded-xl font-bold justify-between h-10">
                      Ventas Profesional <Settings className="w-4 h-4" />
                    </Button>
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
                <div className="divide-y divide-border/50">
                  {[
                    { type: 'msg', user: '+1 555 0123', text: '¿Cuánto cuesta la Prensa Francesa?', time: 'hace 2m' },
                    { type: 'bot', user: 'Respuesta del Bot', text: 'La Prensa Francesa cuesta $29.99. ¿Te gustaría pedir una?', time: 'hace 2m' },
                    { type: 'msg', user: '+1 555 9876', text: '¿Tienen granos de café?', time: 'hace 15m' },
                  ].map((log, idx) => (
                    <div key={idx} className="p-4 flex items-start gap-4 hover:bg-accent/20 transition-colors">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        log.type === 'bot' ? "bg-primary/10 text-primary" : "bg-accent text-muted-foreground"
                      )}>
                        {log.type === 'bot' ? <Bot className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold">{log.user}</span>
                          <span className="text-[10px] font-medium text-muted-foreground">{log.time}</span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground truncate">{log.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full rounded-none h-12 font-bold text-primary hover:bg-primary/5">
                  Ver Registros Completos
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
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-full">Estable</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Tiempo de actividad</span>
                  <span className="text-sm font-bold">99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Latencia</span>
                  <span className="text-sm font-bold">142ms</span>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <Button variant="outline" className="w-full rounded-xl font-bold h-11 gap-2">
                    <Activity className="w-4 h-4" /> Reiniciar Sesión
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
    </MainLayout>
  );
};

export default InstanceDetails;