"use client";

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useInstances } from '@/hooks/use-instances';
import { useGlobalSettings } from '@/hooks/use-global-settings';
import { useChatLogs } from '@/hooks/use-chat-logs';
import { InstanceCard } from '@/components/whatsapp/InstanceCard';
import { QRCodeModal } from '@/components/whatsapp/QRCodeModal';
import { Button } from '@/components/ui/button';
import { Plus, Users, MessageSquare, Zap, Activity, ChartBar } from 'lucide-react';
import { motion } from 'framer-motion';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { ServerStatus } from '@/components/dashboard/ServerStatus';
import { SystemTerminal } from '@/components/dashboard/SystemTerminal';

const Dashboard = () => {
  const { instances, loading, toggleBot, deleteInstance, startLinking, socket, restartInstance } = useInstances();
  const { settings } = useGlobalSettings();
  const { logs: allLogs } = useChatLogs();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

  const stats = [
    { label: 'Total de Instancias', value: instances.length, icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Bots Activos', value: instances.filter(i => i.bot_enabled).length, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Conectados', value: instances.filter(i => i.status === 'connected').length, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Total Mensajes', value: settings.total_messages || 0, icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  const handleRestart = (id: string) => {
    restartInstance(id);
    setSelectedInstanceId(id);
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-nexus-gradient uppercase italic">Panel de Control</h1>
            <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.2em] mt-1">Gestión Central de Inteligencia y Logística</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="rounded-full h-14 px-8 font-black gap-3 bg-gradient-to-r from-amber-500 to-amber-300 text-black shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 transition-all uppercase tracking-widest text-xs"
          >
            <Plus className="w-5 h-5" /> Añadir Nueva Instancia
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="nexus-card p-6 border-t-2 border-white/5 hover:border-white/10 transition-colors relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-5 relative z-10">
                <div className={`p-4 rounded-2xl ${stat.bg} border border-white/5`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className="text-3xl font-black tracking-tighter text-white">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-10">
          <div className="nexus-card p-[1px] rounded-3xl border-nexus-glow overflow-hidden">
            <div className="bg-[#0d0e12]/95 p-6 rounded-[calc(1.5rem-1px)]">
              <ServerStatus socket={socket} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="nexus-card p-6 border-l-4 border-purple-500/50">
              <ActivityChart data={allLogs} />
            </div>
            <div className="nexus-card p-6 border-r-4 border-amber-500/50">
              <SystemTerminal socket={socket} />
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic text-gray-400">Tus Instancias</h2>
            <div className="flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {instances.filter(i => i.status === 'connected').length} Agentes en Línea
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[300px] rounded-3xl bg-accent/50 animate-pulse" />
              ))}
            </div>
          ) : instances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instances.map((instance) => (
                <InstanceCard
                  key={instance.id}
                  instance={instance}
                  onToggleBot={toggleBot}
                  onDelete={deleteInstance}
                  onRestart={handleRestart}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-accent/20 rounded-[40px] border-2 border-dashed border-border/50">
              <div className="p-6 bg-background rounded-full shadow-xl">
                <MessageSquare className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">No se encontraron instancias</h3>
                <p className="text-muted-foreground max-w-md mx-auto font-medium">
                  Comienza vinculando tu primera cuenta de WhatsApp.
                </p>
              </div>
              <Button onClick={() => { setSelectedInstanceId(null); setIsModalOpen(true); }} variant="outline" className="rounded-2xl h-12 px-8 font-bold border-primary/20 text-primary hover:bg-primary/5">
                Vincular WhatsApp Ahora
              </Button>
            </div>
          )}
        </div>
      </div>

      <QRCodeModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedInstanceId(null); }}
        onStartLinking={startLinking}
        socket={socket}
        instanceId={selectedInstanceId || undefined}
        onSuccess={() => { setIsModalOpen(false); setSelectedInstanceId(null); }}
      />
    </MainLayout>
  );
};

export default Dashboard;