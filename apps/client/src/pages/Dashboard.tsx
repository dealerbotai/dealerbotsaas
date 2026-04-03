"use client";

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { InstanceCard } from '@/components/whatsapp/InstanceCard';
import { Button } from '@/components/ui/button';
import { Plus, Users, MessageSquare, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { instances, loading, toggleBot, deleteInstance, addInstance } = useWhatsApp();

  const stats = [
    { label: 'Instancias Totales', value: instances.length, icon: Users, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Agentes Activos', value: instances.filter(i => i.bot_enabled).length, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-600/5' },
    { label: 'Nodos Online', value: instances.filter(i => i.status === 'connected').length, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-600/5' },
    { label: 'Volumen Mensajes', value: '1.2k', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/5' },
  ];

  return (
    <MainLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Dashboard</h1>
            <p className="text-xs text-muted-foreground font-medium">Infraestructura IA en tiempo real.</p>
          </div>
          <Button 
            onClick={() => navigate('/instances/new')} 
            className="rounded-xl h-10 px-6 font-black gap-2 shadow-lg shadow-primary/5 hover:opacity-90 transition-all uppercase text-[9px] tracking-widest"
          >
            <Plus className="w-4 h-4" /> Nueva Instancia
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card p-5 rounded-[24px] shadow-sm border border-border/5"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{stat.label}</p>
                  <p className="text-xl font-black text-foreground">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight uppercase">Canales Activos</h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {instances.filter(i => i.status === 'connected').length} Online
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-[32px] bg-secondary/30 animate-pulse" />
              ))}
            </div>
          ) : instances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {instances.map((instance) => (
                <InstanceCard
                  key={instance.id}
                  instance={instance}
                  onToggleBot={toggleBot}
                  onDelete={deleteInstance}
                  onStart={(id, name) => navigate(`/instances/new?id=${id}&name=${name}`)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 bg-secondary/10 rounded-[48px] border-2 border-dashed border-border/40">
              <div className="p-8 bg-card rounded-[32px] shadow-xl">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black tracking-tight uppercase">Infraestructura Vacía</h3>
                <p className="text-muted-foreground max-w-sm mx-auto font-medium">
                  Comienza el despliegue de tu primer nodo de comunicación inteligente.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/instances/new')} 
                variant="outline" 
                className="rounded-2xl h-14 px-10 font-black border-2 text-primary hover:bg-primary/5 uppercase text-[11px] tracking-widest"
              >
                Iniciar Asistente
              </Button>
            </div>
          )}
        </div>
      </div>

    </MainLayout>
  );
};

export default Dashboard;
