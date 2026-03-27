"use client";

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useInstances } from '@/hooks/use-instances';
import { useGlobalSettings } from '@/hooks/use-global-settings';
import { ServerStatus } from '@/components/dashboard/ServerStatus';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { SystemTerminal } from '@/components/dashboard/SystemTerminal';
import { InstanceCard } from '@/components/whatsapp/InstanceCard';
import { QRCodeModal } from '@/components/whatsapp/QRCodeModal';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { instances, loading, toggleBot, deleteInstance, startLinking, socket } = useInstances();
  const { settings } = useGlobalSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const stats = [
    { label: 'Instancias Activas', value: instances.filter(i => i.status === 'connected').length, total: instances.length },
    { label: 'Mensajes Hoy', value: settings.total_messages || 0, trend: '+12%' },
    { label: 'Bots Encendidos', value: instances.filter(i => i.bot_enabled).length, total: instances.length },
  ];

  return (
    <MainLayout>
      <div className="space-y-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitorea y gestiona tus automatizaciones de WhatsApp.</p>
          </div>
          <Button onClick={() => { setSelectedInstanceId(null); setIsModalOpen(true); }} className="rounded-lg h-11 px-6 font-semibold gap-2">
            <Plus className="w-4 h-4" /> Nueva Instancia
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="dealerbot-card p-6"
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                {stat.total !== undefined && (
                  <span className="text-sm text-muted-foreground">/ {stat.total}</span>
                )}
                {stat.trend && (
                  <span className="text-xs font-bold text-green-500 ml-auto">{stat.trend}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Instancias de WhatsApp</h2>
              <div className="flex bg-muted p-1 rounded-lg">
                <Button 
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('grid')}
                  className="rounded-md h-8 w-8 p-0"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('list')}
                  className="rounded-md h-8 w-8 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
                {instances.map((instance) => (
                  <InstanceCard
                    key={instance.id}
                    instance={instance}
                    onToggleBot={() => toggleBot(instance.id, !instance.bot_enabled)}
                    onDelete={() => deleteInstance(instance.id)}
                    onLink={() => { setSelectedInstanceId(instance.id); setIsModalOpen(true); }}
                  />
                ))}
              </div>
            )}
            
            <ActivityChart />
          </div>

          <div className="space-y-8">
            <ServerStatus />
            <SystemTerminal />
          </div>
        </div>

        <QRCodeModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStartLinking={startLinking}
          socket={socket}
          instanceId={selectedInstanceId || undefined}
          onSuccess={() => { setIsModalOpen(false); setSelectedInstanceId(null); }}
        />
      </div>
    </MainLayout>
  );
};

export default Dashboard;