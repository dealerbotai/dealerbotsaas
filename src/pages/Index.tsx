"use client";

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { InstanceCard } from '@/components/whatsapp/InstanceCard';
import { QRCodeModal } from '@/components/whatsapp/QRCodeModal';
import { 
    Activity, 
    MessageSquare, 
    Zap, 
    PlusCircle,
    LayoutGrid,
    LayoutList,
    Sparkles,
    Cpu,
    Search,
    Bot,
    MoreVertical,
    ExternalLink,
    Trash2,
    Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Index = () => {
  const { instances, loading, addInstance, startInstance, toggleBot, deleteInstance } = useWhatsApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [linkingInstance, setLinkingInstance] = useState<{id: string, name: string} | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected'>('all');

  const handleStartInstance = (id: string, name: string) => {
    setLinkingInstance({ id, name });
    startInstance(id, name);
    setIsModalOpen(true);
  };

  const filteredInstances = instances.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (i.phone_number && i.phone_number.includes(searchQuery));
    const matchesStatus = statusFilter === 'all' ? true : 
                         statusFilter === 'connected' ? i.status === 'connected' : i.status !== 'connected';
    return matchesSearch && matchesStatus;
  });

  const activeInstancesCount = instances.filter(i => i.status === 'connected').length;

  return (
    <MainLayout>
      <div className="space-y-12">
        {/* Hero Section */}
        <section className="relative p-10 rounded-[48px] overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-md">
          <div className="absolute top-0 right-0 p-10 opacity-20">
            <Cpu className="w-64 h-64 text-primary animate-pulse" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 px-4 py-1.5 rounded-full font-black text-[10px] tracking-[3px] uppercase">
              <Sparkles className="w-3 h-3 mr-2" /> AI Engine v2.0 Active
            </Badge>
            <h1 className="text-5xl font-black text-white tracking-tighter leading-[1.1] mb-6">
              Domina tus ventas con <span className="text-gradient">Inteligencia Artificial.</span>
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed mb-8">
              Dealerbot gestiona tus conversaciones de WhatsApp en tiempo real, cerrando ventas y resolviendo dudas con la velocidad de Groq™.
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/80 text-black font-black h-14 px-8 rounded-2xl ai-glow-hover transition-all uppercase text-xs tracking-widest">
              <PlusCircle className="w-5 h-5 mr-2" /> Nueva Instancia
            </Button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Instancias" value={activeInstancesCount.toString()} icon={Activity} trend="+2" color="text-primary" />
          <StatCard title="Mensajes AI" value="4.2k" icon={MessageSquare} trend="+12%" color="text-blue-400" />
          <StatCard title="Conversión" value="24%" icon={Zap} trend="+5%" color="text-secondary" />
          <StatCard title="Uptime" value="99.9%" icon={Cpu} trend="Stable" color="text-green-400" />
        </section>

        {/* Header con Controles de Vista */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Mis Instancias</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Control total sobre tus nodos de comunicación.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                    placeholder="Buscar instancia..." 
                    className="pl-10 h-11 bg-white/5 border-white/10 rounded-2xl text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setStatusFilter('all')}
                    className={cn("rounded-xl px-4 h-9 text-xs font-bold", statusFilter === 'all' && "bg-white/10 text-primary")}
                >
                    Todas
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setStatusFilter('connected')}
                    className={cn("rounded-xl px-4 h-9 text-xs font-bold", statusFilter === 'connected' && "bg-white/10 text-primary")}
                >
                    Online
                </Button>
            </div>

            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setView('grid')} 
                  className={cn("rounded-xl h-9 w-9", view === 'grid' && "bg-white/10 text-primary")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setView('list')} 
                  className={cn("rounded-xl h-9 w-9", view === 'list' && "bg-white/10 text-primary")}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
            </div>
          </div>
        </div>

        {/* Renderizado de Instancias */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-72 bg-white/5 animate-pulse rounded-[32px]" />)}
          </div>
        ) : filteredInstances.length === 0 ? (
          <div className="py-20 text-center space-y-6 bg-white/5 rounded-[40px] border-2 border-dashed border-white/10">
             <MessageSquare className="w-12 h-12 text-slate-600 mx-auto" />
             <p className="text-slate-400 font-medium">No se encontraron instancias.</p>
          </div>
        ) : (
          <div className={cn(
            "gap-8", 
            view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
          )}>
            <AnimatePresence mode="popLayout">
              {filteredInstances.map((instance) => (
                <motion.div
                  key={instance.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  {view === 'grid' ? (
                    <InstanceCard
                      instance={instance}
                      onToggleBot={toggleBot}
                      onDelete={deleteInstance}
                      onStart={handleStartInstance}
                    />
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center justify-between hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          instance.status === 'connected' ? "bg-cyan-500/20 text-cyan-400" : "bg-white/10 text-slate-500"
                        )}>
                          <Bot className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-black text-white uppercase text-sm">{instance.name}</h3>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{instance.phone_number || 'Sin vincular'}</p>
                        </div>
                      </div>
                      
                      <div className="hidden md:flex items-center gap-10">
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Estado</span>
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase border-none",
                            instance.status === 'connected' ? "text-green-500 bg-green-500/10" : "text-slate-500 bg-white/5"
                          )}>
                            {instance.status}
                          </Badge>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Bot AI</span>
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase border-none",
                            instance.bot_enabled ? "text-cyan-400 bg-cyan-400/10" : "text-slate-500 bg-white/5"
                          )}>
                            {instance.bot_enabled ? 'Activo' : 'Manual'}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link to={`/instances/${instance.id}`}>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10 text-slate-400">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/10 text-slate-400">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0f172a] border-white/10 rounded-2xl p-2">
                            <DropdownMenuItem asChild className="rounded-xl focus:bg-white/10 cursor-pointer">
                              <Link to={`/instances/${instance.id}`} className="flex items-center gap-3 p-2 text-xs font-bold text-white uppercase">
                                <ExternalLink className="w-4 h-4 text-cyan-400" /> Detalles
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="rounded-xl focus:bg-red-500/10 text-red-400 cursor-pointer flex items-center gap-3 p-2 text-xs font-bold uppercase"
                              onClick={() => deleteInstance(instance.id)}
                            >
                              <Trash2 className="w-4 h-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <QRCodeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addInstance}
        instances={instances}
        initialInstance={linkingInstance}
      />
    </MainLayout>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <motion.div whileHover={{ y: -5 }} className="glass-card p-8">
    <div className="flex items-center justify-between mb-6">
      <div className={cn("p-3 rounded-2xl bg-white/5", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <Badge variant="outline" className="text-[10px] font-black border-white/10 text-slate-500 px-3 py-1 rounded-full">
        {trend}
      </Badge>
    </div>
    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-2">{title}</h3>
    <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
  </motion.div>
);

export default Index;