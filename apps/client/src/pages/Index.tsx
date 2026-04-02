"use client";

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { InstanceCard } from '@/components/whatsapp/InstanceCard';
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
    Settings,
    Globe,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Index = () => {
  const navigate = useNavigate();
  const { instances, loading, addInstance, startInstance, toggleBot, deleteInstance } = useWhatsApp();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected'>('all');

  const containerRef = useRef<HTMLDivElement>(null);

  const handleStartInstance = (id: string, name: string) => {
    // We can still use a modal for simple reconnection or redirect to wizard?
    // For now, let's keep the wizard for "New" and maybe a simplified connection view for existing.
    startInstance(id, name);
    navigate(`/instances/new?id=${id}&name=${name}`);
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
      <div ref={containerRef} className="max-w-[1400px] mx-auto space-y-16">
        {/* Corporate Minimalist Hero Section */}
        <section className="relative p-12 md:p-20 rounded-[48px] overflow-hidden bg-white border border-border/5 shadow-sm">
          <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
            <Globe className="w-96 h-96 text-primary" />
          </div>
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[3px] mb-10">
              <Shield className="w-3.5 h-3.5" /> Enterprise Grade Infrastructure
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-[0.9] mb-8 uppercase">
              Omnicanalidad <br />
              <span className="text-primary italic">Empresarial.</span>
            </h1>
            <p className="text-xl text-muted-foreground font-medium leading-relaxed mb-12 max-w-2xl">
              Despliega agentes de inteligencia artificial en tus canales oficiales. Control total, seguridad bancaria y escalabilidad sin límites.
            </p>
            <div className="flex flex-wrap gap-4">
                <Button 
                    onClick={() => navigate('/instances/new')} 
                    className="bg-primary text-primary-foreground font-black h-16 px-10 rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all uppercase text-[11px] tracking-widest"
                >
                    <PlusCircle className="w-5 h-5 mr-3" /> Configurar Nueva Instancia
                </Button>
                <Button variant="outline" className="h-16 px-10 rounded-2xl font-black border-2 uppercase text-[11px] tracking-widest hover:bg-secondary transition-colors">
                    Ver Auditoría de Red
                </Button>
            </div>
          </div>
        </section>

        {/* Stats with more air */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard title="Nodos Activos" value={activeInstancesCount.toString()} icon={Activity} trend="+2" color="text-primary" />
          <StatCard title="Mensajes AI" value="4.2k" icon={MessageSquare} trend="+12%" color="text-sky-500" />
          <StatCard title="Tasa Conversión" value="24%" icon={Zap} trend="+5%" color="text-amber-500" />
          <StatCard title="Disponibilidad" value="99.9%" icon={Cpu} trend="Stable" color="text-emerald-500" />
        </section>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">Mis Instancias</h2>
            <p className="text-muted-foreground font-medium">Panel de control de tus terminales de mensajería.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Buscar por nombre..." 
                    className="pl-11 h-12 w-full md:w-72 bg-secondary/40 border-none rounded-2xl text-foreground font-bold text-xs shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-1.5 bg-secondary/40 p-1.5 rounded-2xl shadow-inner">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setStatusFilter('all')}
                    className={cn("rounded-xl px-5 h-9 text-[10px] font-black uppercase tracking-widest", statusFilter === 'all' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                    Todas
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setStatusFilter('connected')}
                    className={cn("rounded-xl px-5 h-9 text-[10px] font-black uppercase tracking-widest", statusFilter === 'connected' ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >
                    Online
                </Button>
            </div>

            <div className="flex items-center gap-1.5 bg-secondary/40 p-1.5 rounded-2xl shadow-inner">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setView('grid')} 
                  className={cn("rounded-xl h-9 w-9 transition-all", view === 'grid' ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setView('list')} 
                  className={cn("rounded-xl h-9 w-9 transition-all", view === 'list' ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
            </div>
          </div>
        </div>

        {/* Instances Display */}
        <div className="pb-20">
            {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[1, 2, 3].map(i => <div key={i} className="h-80 bg-secondary/30 animate-pulse rounded-[32px]" />)}
            </div>
            ) : filteredInstances.length === 0 ? (
            <div className="py-24 text-center space-y-6 bg-secondary/20 rounded-[40px] border-2 border-dashed border-border/40">
                <div className="w-20 h-20 bg-card rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">No se encontraron nodos activos.</p>
            </div>
            ) : (
            <div className={cn(
                "gap-10", 
                view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
            )}>
                <AnimatePresence mode="popLayout">
                {filteredInstances.map((instance) => (
                    <motion.div
                    key={instance.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    >
                    {view === 'grid' ? (
                        <InstanceCard
                        instance={instance}
                        onToggleBot={toggleBot}
                        onDelete={deleteInstance}
                        onStart={handleStartInstance}
                        />
                    ) : (
                        <motion.div 
                        whileHover={{ scale: 1.01, x: 5 }}
                        className="bg-card p-6 flex items-center justify-between group relative rounded-[32px] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                        >
                        <div className="flex items-center gap-8">
                            <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                            instance.status === 'connected' ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground/40"
                            )}>
                            {instance.status === 'connected' ? <Bot className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
                            </div>
                            
                            <div className="min-w-[240px]">
                            <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-1">{instance.name}</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest font-mono">
                                    {instance.phone_number || 'PENDIENTE DE VINCULAR'}
                                </span>
                                {instance.status === 'connected' && (
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase h-4 px-2">Activo</Badge>
                                )}
                            </div>
                            </div>

                            <div className="hidden lg:grid grid-cols-2 gap-16 ml-8">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[2px] mb-2">Estado Motor</span>
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            instance.status === 'connected' ? "bg-emerald-500" : "bg-muted-foreground/30"
                                        )} />
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest",
                                            instance.status === 'connected' ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {instance.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[2px] mb-2">Inteligencia</span>
                                    <div className="flex items-center gap-3">
                                        <Zap className={cn("w-3.5 h-3.5", instance.bot_enabled ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30")} />
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest",
                                            instance.bot_enabled ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {instance.bot_enabled ? 'IA ONLINE' : 'MANUAL'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col items-end mr-8">
                                <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[2px] mb-2">Última Sincronización</span>
                                <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest font-mono">
                                    {instance.last_connected_at ? new Date(instance.last_connected_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                </span>
                            </div>

                            <Link to={`/instances/${instance.id}`}>
                            <Button variant="secondary" size="icon" className="h-12 w-12 rounded-2xl text-muted-foreground hover:text-primary hover:bg-card transition-all shadow-sm">
                                <Settings className="w-5 h-5" />
                            </Button>
                            </Link>
                            
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-secondary text-muted-foreground">
                                <MoreVertical className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-none rounded-2xl p-2 min-w-[180px] shadow-2xl">
                                <DropdownMenuItem asChild className="rounded-xl focus:bg-secondary cursor-pointer">
                                <Link to={`/instances/${instance.id}`} className="flex items-center gap-3 p-3 text-xs font-bold text-foreground uppercase tracking-widest">
                                    <ExternalLink className="w-4 h-4 text-primary" /> Detalles
                                </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                className="rounded-xl focus:bg-destructive/10 text-destructive cursor-pointer flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-widest"
                                onClick={() => deleteInstance(instance.id)}
                                >
                                <Trash2 className="w-4 h-4" /> Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        </motion.div>
                    )}
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>
            )}
        </div>
      </div>
    </MainLayout>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const onMouseEnter = () => {
    gsap.to(cardRef.current, { y: -8, duration: 0.3, ease: "power2.out" });
  };

  const onMouseLeave = () => {
    gsap.to(cardRef.current, { y: 0, duration: 0.3, ease: "power2.out" });
  };

  return (
    <div 
      ref={cardRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="stat-card bg-card p-10 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group cursor-default"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className={cn("p-4 rounded-2xl bg-secondary/50", color)}>
          <Icon className="w-7 h-7" />
        </div>
        <Badge variant="secondary" className="text-[10px] font-black text-muted-foreground px-4 py-1.5 rounded-full bg-card shadow-sm">
          {trend}
        </Badge>
      </div>
      <h3 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[3px] mb-3 relative z-10">{title}</h3>
      <p className="text-5xl font-black text-foreground tracking-tighter relative z-10">{value}</p>
    </div>
  );
};

export default Index;
