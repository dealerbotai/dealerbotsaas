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
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight uppercase">Panel de Control</h1>
            <p className="text-muted-foreground font-medium mt-1">Supervisión en tiempo real de tu infraestructura IA.</p>
          </div>
          <Button 
            onClick={() => navigate('/instances/new')} 
            className="rounded-2xl h-14 px-8 font-black gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all uppercase text-[10px] tracking-widest"
          >
            <Plus className="w-5 h-5" /> Nueva Instancia
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card p-8 rounded-[32px] shadow-sm border border-border/5"
            >
              <div className="flex flex-col gap-6">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[2px] mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-foreground">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight uppercase">Tus Canales</h2>
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/5 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {instances.filter(i => i.status === 'connected').length} En línea
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
