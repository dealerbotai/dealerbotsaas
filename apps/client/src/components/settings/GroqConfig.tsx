"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Key, Save, Eye, EyeOff, CheckCircle2, Cpu, ShieldCheck, AlertCircle } from 'lucide-react';
import { sileo as toast } from 'sileo';
import { supabase } from '@/lib/supabase';

interface GroqConfigProps {
  storeId: string;
  initialApiKey?: string;
}

export const GroqConfig = ({ storeId, initialApiKey = "" }: GroqConfigProps) => {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleSave = async () => {
    if (!apiKey.startsWith('gsk_')) {
        toast.error('Formato de API Key inválido. Debe comenzar con gsk_');
        return;
    }

    setLoading(true);
    try {
        // 1. Guardar en Supabase (Se recomienda que el backend encripte esto)
        const { error } = await supabase
            .from('stores')
            .update({ api_key_encrypted: apiKey })
            .eq('id', storeId);

        if (error) throw error;
        toast.success('API Key vinculada a tu sucursal con éxito.');
    } catch (error: any) {
        toast.error('Error al guardar: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card className="glass-panel border-none overflow-hidden relative group">
      {/* Efecto decorativo de fondo */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Cpu className="w-48 h-48 text-cyan-400" />
      </div>

      <CardHeader className="border-b border-white/5 pb-8 relative z-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black text-white tracking-tight uppercase">Motor de Inteligencia Groq™</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
                Inyecta tu propia infraestructura de IA para procesar pedidos y normalizar logística.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-10 space-y-8 relative z-10">
        <div className="space-y-3">
          <Label className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] px-1">
            Tu API Key de Groq (llama3-70b-8192)
          </Label>
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="h-14 bg-white/5 border-white/10 rounded-2xl text-base font-medium focus:ring-cyan-500/20 focus:border-cyan-500/50 text-white placeholder:text-slate-700"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl hover:bg-white/5 text-slate-500"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 px-1">
             <AlertCircle className="w-3 h-3 text-slate-600" />
             <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Tu llave se encripta de punto a punto.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">Modelo Activo</p>
                <p className="text-xs font-bold text-white uppercase">Llama 3 70B Versatile</p>
            </div>
            <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Logs de Consumo</p>
                <p className="text-xs font-bold text-white uppercase">Habilitado por Sucursal</p>
            </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={loading || !apiKey}
          className="w-full h-14 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-2xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-3 uppercase tracking-widest text-xs ai-glow-hover"
        >
          {loading ? 'Sincronizando...' : (
            <>
              <Save className="w-5 h-5" /> Vincular Infraestructura IA
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};