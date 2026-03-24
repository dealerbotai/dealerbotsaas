import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Sparkles, Wand2 } from 'lucide-react';

interface PersonalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPersonality: string;
  globalPersonality: string;
  onSave: (newPersonality: string) => void;
}

export const PersonalityModal = ({ isOpen, onClose, currentPersonality, globalPersonality, onSave }: PersonalityModalProps) => {
  const [personality, setPersonality] = useState(currentPersonality || '');
  const [useGlobal, setUseGlobal] = useState(!currentPersonality);

  const handleSave = () => {
    onSave(useGlobal ? '' : personality);
  };

  const handleUseDefault = () => {
    setPersonality(globalPersonality);
    setUseGlobal(false);
  };
  
  const handleToggleGlobal = () => {
    if (!useGlobal) {
      setPersonality('');
    }
    setUseGlobal(!useGlobal);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold">Personalidad del Asistente</DialogTitle>
          </div>
          <DialogDescription>
            Define el comportamiento de tu bot. Puedes usar la configuración global o una personalizada.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="p-4 rounded-2xl bg-accent/50 border border-border/50">
            <div className="flex items-center justify-between">
              <Label htmlFor="use-global" className="font-bold">Usar Personalidad Global</Label>
              <Button 
                variant={useGlobal ? "secondary" : "outline"}
                size="sm"
                onClick={handleToggleGlobal}
                className="rounded-lg"
              >
                {useGlobal ? 'Activado' : 'Desactivado'}
              </Button>
            </div>
            {globalPersonality && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                Actual: "{globalPersonality}"
              </p>
            )}
          </div>

          {!useGlobal && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-personality" className="font-bold">Personalidad Específica</Label>
                <Button variant="ghost" size="sm" onClick={handleUseDefault} className="gap-1.5 h-8">
                  <Wand2 className="w-3 h-3" /> Usar como plantilla
                </Button>
              </div>
              <Textarea
                id="custom-personality"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="Ej: Eres un asistente de ventas muy entusiasta. Usas emojis y un lenguaje juvenil..."
                className="min-h-[150px] rounded-xl"
                disabled={useGlobal}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
          <Button onClick={handleSave} className="rounded-xl gap-2">
            <Save className="w-4 h-4" /> Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
