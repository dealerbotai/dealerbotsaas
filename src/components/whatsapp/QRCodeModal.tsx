import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Loader2, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<any>;
}

export const QRCodeModal = ({ isOpen, onClose, onAdd }: QRCodeModalProps) => {
  const [name, setName] = useState('');
  const [step, setStep] = useState<'input' | 'qr' | 'success'>('input');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const instance = await onAdd(name);
      setQrCode(instance.qrCode);
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
    setQrCode(null);
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
                {qrCode ? (
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-2xl">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">Actualizando en 20s</p>
                </div>
              </div>
              <div className="bg-accent/50 p-4 rounded-2xl border border-border/50 w-full">
                <ol className="text-sm space-y-2 font-medium text-muted-foreground">
                  <li className="flex gap-2"><span className="text-primary font-bold">1.</span> Abre WhatsApp en tu teléfono</li>
                  <li className="flex gap-2"><span className="text-primary font-bold">2.</span> Toca Menú o Ajustes y selecciona Dispositivos Vinculados</li>
                  <li className="flex gap-2"><span className="text-primary font-bold">3.</span> Apunta tu teléfono a esta pantalla para capturar el código</li>
                </ol>
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
            <Button variant="outline" onClick={() => setStep('success')} className="rounded-xl font-bold h-12 px-8 border-primary/20 text-primary hover:bg-primary/5">
              Ya lo he escaneado
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