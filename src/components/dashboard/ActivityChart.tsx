"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

interface ActivityChartProps {
  data: any[];
}

export const ActivityChart = ({ data = [] }: ActivityChartProps) => {
  // Procesar logs para contar mensajes por hora o día
  const processData = () => {
    const counts: Record<string, number> = {};
    const now = new Date();
    
    // Crear últimos 7 días con 0 mensajes
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      counts[d.toLocaleDateString('es-ES', { weekday: 'short' })] = 0;
    }

    // Validar que data sea un array antes de procesar
    if (Array.isArray(data)) {
      data.forEach(log => {
        const date = new Date(log.created_at || Date.now());
        const day = date.toLocaleDateString('es-ES', { weekday: 'short' });
        if (counts[day] !== undefined) {
          counts[day]++;
        }
      });
    }

    return Object.entries(counts).map(([name, total]) => ({ name, total }));
  };

  const chartData = processData();

  return (
    <Card className="nexus-card overflow-hidden border-white/5">
      <CardHeader className="border-b border-white/5">
        <CardTitle className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2 text-white">
          Actividad de Mensajes
          <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 animate-pulse">Sincronizado</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-10">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 800, fill: '#4b5563' }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 800, fill: '#4b5563' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0d0e12',
                  borderRadius: '16px', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                  fontSize: '12px',
                  fontWeight: '900',
                  color: '#fff'
                }}
                itemStyle={{ color: '#a855f7' }}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#a855f7" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};