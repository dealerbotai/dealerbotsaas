import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Key, Save, Eye, EyeOff, CheckCircle2, Sparkles } from 'lucide-react';

interface GroqConfigProps {
  apiKey: string;
  personality?: string;
  onSave: (data: { apiKey: string; personality: string }) => void;
}

export const GroqConfig = ({ apiKey, personality = '', onSave }: GroqConfigProps) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [localPersonality, setLocalPersonality] = useState(personality || '');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSave({ apiKey: localApiKey, personality: localPersonality });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };
  
  const hasChanges = localApiKey !== apiKey || localPersonality !== personality;

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
          Define la clave API y la personalidad de tu asistente de ventas.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Clave API de Groq
          </Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              placeholder="gsk_..."
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
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

        <div className="space-y-2">
          <Label htmlFor="personality" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Personalidad del Asistente
          </Label>
          <Textarea
            id="personality"
            placeholder="Eres un asistente de ventas amigable y servicial. Tu objetivo es ayudar a los clientes a encontrar el producto perfecto..."
            value={localPersonality}
            onChange={(e) => setLocalPersonality(e.target.value)}
            className="rounded-xl border-border/50 focus:ring-primary/20 min-h-[120px]"
          />
        </div>

        <Button 
          onClick={handleSave} 
          className="w-full h-12 rounded-xl font-bold gap-2 transition-all duration-300"
          disabled={!localApiKey || !hasChanges}
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