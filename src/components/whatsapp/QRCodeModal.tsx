import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Loader2, QrCode, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { WhatsAppInstance } from '@/hooks/use-whatsapp-instances';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<any>;
  instances: WhatsAppInstance[];
  initialInstance?: { id: string; name: string } | null;
}

export const QRCodeModal = ({ isOpen, onClose, onAdd, instances, initialInstance }: QRCodeModalProps) => {
  const [name, setName] = useState('');
  const [step, setStep] = useState<'input' | 'qr' | 'success'>('input');
  const [loading, setLoading] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Monitor status in real-time
  useEffect(() => {
    if (currentId) {
      const active = instances.find(i => i.id === currentId);
      if (active?.status === 'connected') {
        setStep('success');
      }
    }
  }, [instances, currentId]);

  useEffect(() => {
    if (isOpen && initialInstance) {
      setCurrentId(initialInstance.id);
      setName(initialInstance.name);
      setStep('qr');
    } else if (isOpen && !initialInstance && step !== 'success') {
       // Reset if opening for new
       // setStep('input'); 
    }
  }, [isOpen, initialInstance]);

  const handleAdd = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const instance = await onAdd(name);
      if (instance) {
        setCurrentId(instance.id);
        setStep('qr');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('input');
    setName('');
    setCurrentId(null);
    onClose();
  };

  const currentInstance = instances.find(i => i.id === currentId);

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
            {step === 'input' && 'Vincular Nueva Cuenta'}
            {step === 'qr' && 'Escanear con WhatsApp'}
            {step === 'success' && '¡Instancia Vinculada!'}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground font-medium">
            {step === 'input' && 'Introduce un nombre identificador para esta cuenta.'}
            {step === 'qr' && 'Abre WhatsApp > Dispositivos Vinculados > Vincular.'}
            {step === 'success' && 'Tu cuenta ya está lista para responder automáticamente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 min-h-[250px] flex items-center justify-center">
          {step === 'input' && (
            <div className="space-y-4 w-full">
              <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nombre de la cuenta</Label>
                <Input
                  placeholder="ej. WhatsApp Ventas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl border-border/50 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          {step === 'qr' && (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="p-4 bg-white rounded-3xl shadow-lg border-4 border-primary/10">
                {currentInstance?.qr ? (
                  <QRCodeSVG value={currentInstance.qr} size={200} includeMargin />
                ) : (
                  <div className="w-48 h-48 flex flex-col items-center justify-center bg-muted rounded-2xl gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-[10px] font-bold text-muted-foreground animate-pulse">GENERANDO QR...</p>
                  </div>
                )}
              </div>
              <div className="bg-accent/50 p-4 rounded-2xl border border-border/50 w-full text-center">
                <p className="text-sm font-bold text-primary animate-pulse">
                  {currentInstance?.status === 'qr_ready' ? 'ESPERANDO ESCANEO...' : 'INICIALIZANDO MOTOR...'}
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="bg-green-500/20 p-8 rounded-full mb-6">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <h3 className="text-xl font-black">Cuenta vinculada con éxito</h3>
              <p className="text-muted-foreground font-medium mt-1">Sincronizando chats en segundo plano...</p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-center gap-3">
          {step === 'input' && (
            <Button onClick={handleAdd} disabled={!name || loading} className="rounded-xl font-bold h-12 px-12 transition-all">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                EMPEZAR VINCULACIÓN
            </Button>
          )}
          {step === 'success' && (
            <Button onClick={handleClose} className="rounded-xl font-bold h-12 px-12 w-full">
              VOLVER AL PANEL
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};