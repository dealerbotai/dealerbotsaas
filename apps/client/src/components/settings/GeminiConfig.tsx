"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Key, Save, Eye, EyeOff, Sparkles, ShieldCheck, AlertCircle, Zap } from 'lucide-react';
import { sileo as toast } from 'sileo';

interface GeminiConfigProps {
  apiKey?: string;
  onSave: (key: string) => void;
}

export const GeminiConfig = ({ apiKey: initialApiKey = "", onSave }: GeminiConfigProps) => {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!apiKey.startsWith('AIza')) {
        toast.error('Formato de API Key de Gemini inválido. Debe comenzar con AIza');
        return;
    }

    setLoading(true);
    try {
        await onSave(apiKey);
        toast.success('Configuración de Gemini guardada.');
    } catch (error: any) {
        toast.error('Error al guardar: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card className="premium-card overflow-hidden relative group border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
        <Sparkles className="w-48 h-48 text-primary" />
      </div>

      <CardHeader className="border-b border-border/50 pb-8 relative z-10">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black text-foreground tracking-tight uppercase">Google Gemini™</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
                Utiliza los modelos más avanzados de Google para potenciar tus ventas automáticas.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-10 space-y-8 relative z-10">
        <div className="space-y-3">
          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[3px] px-1">
            Tu API Key de Gemini (Google AI Studio)
          </Label>
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="h-14 bg-background border-border/50 rounded-2xl text-base font-medium focus:ring-primary/20 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/30"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl hover:bg-accent text-muted-foreground"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2 px-1">
             <AlertCircle className="w-3 h-3 text-muted-foreground/60" />
             <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">Tus datos se mantienen privados y seguros.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-background/50 border border-border/50">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Modelo Recomendado</p>
                <p className="text-xs font-bold text-foreground uppercase">Gemini 1.5 Flash</p>
            </div>
            <div className="p-5 rounded-3xl bg-background/50 border border-border/50">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Capacidad</p>
                <p className="text-xs font-bold text-foreground uppercase">Multimodal (Texto + Imagen)</p>
            </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={loading || !apiKey}
          className="w-full h-14 bg-primary text-primary-foreground font-black rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
        >
          {loading ? 'Guardando...' : (
            <>
              <Save className="w-5 h-5" /> Activar Gemini AI
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
