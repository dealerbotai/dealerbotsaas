"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Cpu, HardDrive, Clock, Activity, Zap } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface Metrics {
  memory: { rss: number; heapUsed: number };
  uptime: number;
  activeClients: number;
  nodeVersion: string;
}

interface ServerStatusProps {
  socket: Socket | null;
}

export const ServerStatus = ({ socket }: ServerStatusProps) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [aiEvents, setAiEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('system-telemetry', (data: Metrics) => {
      setMetrics(data);
    });

    socket.on('system-event', (event: any) => {
      if (event.type === 'ai-latency') {
        setAiEvents(prev => [event, ...prev].slice(0, 5));
      }
    });

    return () => {
      socket.off('system-telemetry');
      socket.off('system-event');
    };
  }, [socket]);

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden md:col-span-2">
        <CardHeader className="bg-accent/30 border-b border-border/50 py-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" /> Salud del Servidor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {metrics ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Memoria RSS
                </p>
                <p className="text-xl font-black">{metrics.memory.rss} MB</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <HardDrive className="w-3 h-3" /> Heap Usado
                </p>
                <p className="text-xl font-black">{metrics.memory.heapUsed} MB</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Uptime
                </p>
                <p className="text-sm font-bold">{formatUptime(metrics.uptime)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Sesiones Vivas
                </p>
                <Badge variant="outline" className="rounded-full px-3 font-black bg-green-500/10 text-green-600 border-green-500/20">
                  {metrics.activeClients} ACTIVAS
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4 text-muted-foreground animate-pulse font-bold text-xs">
              Sincronizando con el servidor...
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border/50 py-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> Latencia Groq
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {aiEvents.length > 0 ? aiEvents.map((event, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-medium border-b border-border/30 pb-2 last:border-0">
                <span className="text-muted-foreground">ID: {event.instanceId.substring(0, 5)}...</span>
                <Badge variant="secondary" className="font-bold text-[10px]">
                  {event.duration}ms
                </Badge>
              </div>
            )) : (
              <p className="text-[10px] text-center text-muted-foreground py-4 font-bold italic">Esperando peticiones de IA...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};