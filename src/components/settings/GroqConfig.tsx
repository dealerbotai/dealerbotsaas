"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Key, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface GroqConfigProps {
  apiKey: string;
  onSave: (key: string) => void;
}

export const GroqConfig = ({ apiKey, onSave }: GroqConfigProps) => {
  const [value, setValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSave(value);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">Configuración de Groq AI</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground font-medium">
          Introduce tu clave API de Groq para potenciar el bot de ventas. Tu clave se guarda localmente y nunca se comparte.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Clave API
          </Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              placeholder="gsk_..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-12 rounded-xl pr-12 border-border/50 focus:ring-primary/20 font-mono"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg hover:bg-accent"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          className="w-full h-12 rounded-xl font-bold gap-2 transition-all duration-300"
          disabled={!value || value === apiKey}
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Guardado con Éxito
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Guardar Configuración
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};