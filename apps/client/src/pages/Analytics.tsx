"use client";

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { 
    MessageSquare, 
    Zap, 
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Bot,
    Lock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { Button } from '@/components/ui/button';

const data = [
  { name: 'Lun', mensajes: 400, ai: 240, ventas: 24 },
  { name: 'Mar', mensajes: 300, ai: 139, ventas: 18 },
  { name: 'Mie', mensajes: 200, ai: 980, ventas: 45 },
  { name: 'Jue', mensajes: 278, ai: 390, ventas: 30 },
  { name: 'Vie', mensajes: 189, ai: 480, ventas: 28 },
  { name: 'Sab', mensajes: 239, ai: 380, ventas: 35 },
  { name: 'Dom', mensajes: 349, ai: 430, ventas: 40 },
];

const Analytics = () => {
  const { workspace } = useWhatsApp();
  const canUseAdvanced = workspace?.plan && workspace.plan !== 'free';

  return (
    <MainLayout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Analíticas de Rendimiento</h1>
          <p className="text-slate-400 font-medium mt-2">Métricas detalladas de tus asistentes de ventas y flujo de mensajes.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Total Mensajes" 
            value="12,842" 
            trend="+14.2%" 
            positive={true}
            icon={MessageSquare}
            color="text-blue-400"
            bg="bg-blue-400/10"
          />
          <MetricCard 
            title="Intervención IA" 
            value="86.4%" 
            trend="+5.1%" 
            positive={true}
            icon={Bot}
            color="text-cyan-400"
            bg="bg-cyan-400/10"
          />
          <MetricCard 
            title="Ventas Cerradas" 
            value="428" 
            trend="-2.4%" 
            positive={false}
            icon={Zap}
            color="text-orange-400"
            bg="bg-orange-400/10"
          />
          <MetricCard 
            title="Tiempo de Respuesta" 
            value="1.2s" 
            trend="-0.8s" 
            positive={true}
            icon={Clock}
            color="text-purple-400"
            bg="bg-purple-400/10"
          />
        </div>

        <div className="relative">
          {!canUseAdvanced && (
            <div className="absolute inset-0 z-20 bg-background/40 backdrop-blur-md rounded-[40px] flex flex-col items-center justify-center border border-white/10 p-8 text-center">
                <div className="bg-primary/20 p-5 rounded-[2rem] mb-6">
                    <Lock className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white">Analítica Predictiva</h3>
                <p className="text-slate-400 font-medium max-w-md mt-3 mb-8">
                    Visualiza tendencias, picos de demanda y el rendimiento individual de tus agentes con el Plan Starter.
                </p>
                <Button 
                    onClick={() => window.location.href = '/billing'}
                    className="bg-primary text-white font-black px-10 h-14 rounded-2xl shadow-2xl shadow-primary/20 uppercase text-xs tracking-[2px] hover:scale-105 transition-all"
                >
                    Desbloquear Reportes
                </Button>
            </div>
          )}

          <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-8", !canUseAdvanced && "opacity-20 grayscale pointer-events-none")}>
            {/* Volume Chart */}
            <Card className="rounded-[40px] border-white/5 bg-white/5 backdrop-blur-xl overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-lg font-black text-white uppercase tracking-widest">Volumen de Mensajes</CardTitle>
                <CardDescription className="text-slate-500">Comparativa entre mensajes totales y respuestas de la IA.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="mensajes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMsg)" strokeWidth={3} />
                    <Area type="monotone" dataKey="ai" stroke="#06b6d4" fillOpacity={1} fill="url(#colorAI)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion Chart */}
            <Card className="rounded-[40px] border-white/5 bg-white/5 backdrop-blur-xl overflow-hidden">
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-lg font-black text-white uppercase tracking-widest">Conversión de Ventas</CardTitle>
                <CardDescription className="text-slate-500">Ventas cerradas exitosamente por el bot.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px' }}
                    />
                    <Bar dataKey="ventas" fill="#f97316" radius={[10, 10, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Agents Table */}
          <div className={cn("mt-8", !canUseAdvanced && "opacity-20 grayscale pointer-events-none")}>
            <Card className="rounded-[40px] border-white/5 bg-white/5 backdrop-blur-xl overflow-hidden">
              <CardHeader className="p-8">
                <CardTitle className="text-lg font-black text-white uppercase tracking-widest">Rendimiento por Agente</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Agente</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Mensajes</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Precisión</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ventas</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[
                        { name: 'Vendedor Premium', msgs: '4,281', acc: '98%', sales: '142', status: 'Activo' },
                        { name: 'Soporte Técnico', msgs: '2,104', acc: '94%', sales: '12', status: 'Activo' },
                        { name: 'Cierre de Ofertas', msgs: '1,892', acc: '99%', sales: '214', status: 'En Pausa' },
                      ].map((agent, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-cyan-400" />
                              </div>
                              <span className="font-bold text-white">{agent.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 font-medium text-slate-400">{agent.msgs}</td>
                          <td className="px-8 py-6">
                            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-black">
                              {agent.acc}
                            </Badge>
                          </td>
                          <td className="px-8 py-6 font-black text-orange-400">{agent.sales}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-1.5 h-1.5 rounded-full", agent.status === 'Activo' ? "bg-green-500" : "bg-slate-500")} />
                              <span className="text-xs font-bold text-slate-400">{agent.status}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

const MetricCard = ({ title, value, trend, positive, icon: Icon, color, bg }: any) => (
  <Card className="rounded-[32px] border-white/5 bg-white/5 backdrop-blur-xl p-6 group hover:bg-white/10 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-3 rounded-2xl", bg, color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={cn(
        "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
        positive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
      )}>
        {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {trend}
      </div>
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-1">{title}</p>
      <p className="text-2xl font-black text-white tracking-tight">{value}</p>
    </div>
  </Card>
);

export default Analytics;
