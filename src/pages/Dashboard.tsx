"use client";

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { InstanceCard } from '@/components/whatsapp/InstanceCard';
import { QRCodeModal } from '@/components/whatsapp/QRCodeModal';
import { Button } from '@/components/ui/button';
import { Plus, Users, MessageSquare, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { instances, loading, toggleBot, deleteInstance, addInstance } = useWhatsApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stats = [
    { label: 'Total de Instancias', value: instances.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Bots Activos', value: instances.filter(i => i.botEnabled).length, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Conectados', value: instances.filter(i => i.status === 'connected').length, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Mensajes Hoy', value: '1,284', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
            <p className="text-muted-foreground font-medium">Gestiona tu red de automatización de WhatsApp.</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="rounded-2xl h-12 px-6 font-bold gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          >
            <Plus className="w-5 h-5" /> Añadir Nueva Instancia
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card border border-border/50 p-6 rounded-3xl shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Tus Instancias</h2>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              {instances.filter(i => i.status === 'connected').length} En línea
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  Comienza vinculando tu primera cuenta de WhatsApp. Puedes gestionar múltiples cuentas desde un solo lugar.
                </p>
              </div>
              <Button onClick={() => setIsModalOpen(true)} variant="outline" className="rounded-2xl h-12 px-8 font-bold border-primary/20 text-primary hover:bg-primary/5">
                Vincular WhatsApp Ahora
              </Button>
            </div>
          )}
        </div>
      </div>

      <QRCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addInstance}
        instances={instances}
      />

    </MainLayout>
  );
};

export default Dashboard;