import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Loader2, QrCode, CheckCircle2, Info } from 'lucide-react';
import { WhatsAppInstance } from '@/lib/api';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<WhatsAppInstance>;
  instances: WhatsAppInstance[];
}

export const QRCodeModal = ({ isOpen, onClose, onAdd, instances }: QRCodeModalProps) => {
  const [name, setName] = useState('');
  const [step, setStep] = useState<'input' | 'qr' | 'success'>('input');
  const [loading, setLoading] = useState(false);
  const [currentInstanceId, setCurrentInstanceId] = useState<string | null>(null);

  const currentInstance = instances.find(i => i.id === currentInstanceId);

  useEffect(() => {
    if (currentInstance?.status === 'connected') {
      setStep('success');
    }
  }, [currentInstance?.status]);

  const handleAdd = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const instance = await onAdd(name);
      setCurrentInstanceId(instance.id);
      setStep('qr');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setName('');
    setCurrentInstanceId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl border-border/50 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="mx-auto bg-primary/10 p-4 rounded-2xl w-fit">
            {step === 'input' && <QrCode className="w-8 h-8 text-primary" />}
            {step === 'qr' && <QrCode className="w-8 h-8 text-primary animate-pulse" />}
            {step === 'success' && <CheckCircle2 className="w-8 h-8 text-green-500" />}
          </div>
          <DialogTitle className="text-2xl font-bold text-center tracking-tight">
            {step === 'input' && 'Añadir Nueva Instancia'}
            {step === 'qr' && 'Escanear Código QR'}
            {step === 'success' && '¡Instancia Vinculada!'}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground font-medium">
            {step === 'input' && 'Dale un nombre a tu instancia de WhatsApp para comenzar.'}
            {step === 'qr' && 'Abre WhatsApp en tu teléfono y escanea el código de abajo.'}
            {step === 'success' && 'Tu cuenta de WhatsApp se ha vinculado correctamente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === 'input' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nombre de la Instancia</Label>
                <Input
                  id="name"
                  placeholder="ej. Bot de Ventas - Principal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl border-border/50 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          {step === 'qr' && (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative p-4 bg-white rounded-3xl shadow-inner border-4 border-primary/10">
                {currentInstance?.qr_code ? (
                  <img src={currentInstance.qr_code} alt="WhatsApp QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex flex-col items-center justify-center bg-muted rounded-2xl p-4 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Generando QR en el servidor...</p>
                  </div>
                )}
              </div>
              
              <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 w-full flex gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-xs font-medium text-blue-700 leading-relaxed">
                  Asegúrate de tener el backend ejecutándose en tu máquina local para que el QR aparezca aquí.
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="bg-green-500/10 p-6 rounded-full mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-lg font-bold text-center">¡Listo para automatizar!</p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-center gap-3">
          {step === 'input' && (
            <>
              <Button variant="ghost" onClick={handleClose} className="rounded-xl font-bold h-12 px-8">Cancelar</Button>
              <Button onClick={handleAdd} disabled={!name || loading} className="rounded-xl font-bold h-12 px-8 min-w-[140px]">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Generar QR
              </Button>
            </>
          )}
          {step === 'qr' && (
            <Button variant="outline" onClick={handleClose} className="rounded-xl font-bold h-12 px-8">
              Cancelar
            </Button>
          )}
          {step === 'success' && (
            <Button onClick={handleClose} className="rounded-xl font-bold h-12 px-12">
              Ir al Panel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};