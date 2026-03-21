import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Loader2, QrCode, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLinking: (name: string) => void;
  socket: Socket | null;
  onSuccess: () => void;
}

export const QRCodeModal = ({ isOpen, onClose, onStartLinking, socket, onSuccess }: QRCodeModalProps) => {
  const [name, setName] = useState('');
  const [step, setStep] = useState<'input' | 'qr' | 'success'>('input');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('qr', (data: { qr: string }) => {
      setQrCode(data.qr);
      setStep('qr');
    });

    socket.on('ready', () => {
      setStep('success');
      onSuccess(); // Refrescar la lista de instancias
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    return () => {
      socket.off('qr');
      socket.off('ready');
      socket.off('error');
    };
  }, [socket, onSuccess]);

  const handleStart = () => {
    if (!name) return;
    setError(null);
    onStartLinking(name);
  };

  const handleClose = () => {
    setStep('input');
    setName('');
    setQrCode(null);
    setError(null);
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
            {step === 'input' && 'Vincular Nuevo WhatsApp'}
            {step === 'qr' && 'Escanea el Código QR'}
            {step === 'success' && '¡Vinculación Exitosa!'}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {step === 'input' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Nombre de la Instancia</Label>
                <Input
                  id="name"
                  placeholder="ej. Ventas México"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-xl flex gap-2 text-sm font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
            </div>
          )}

          {step === 'qr' && (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative p-4 bg-white rounded-3xl shadow-inner border-4 border-primary/10">
                {qrCode ? (
                  <QRCodeSVG value={qrCode} size={200} />
                ) : (
                  <div className="w-48 h-48 flex flex-col items-center justify-center bg-muted rounded-2xl p-4 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Generando QR...</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-center text-muted-foreground font-medium">
                Abre WhatsApp > Dispositivos vinculados > Vincular un dispositivo
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="bg-green-500/10 p-6 rounded-full mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-lg font-bold text-center">La instancia se ha guardado y está lista.</p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-center gap-3">
          {step === 'input' && (
            <Button onClick={handleStart} disabled={!name} className="rounded-xl font-bold h-12 px-8 w-full">
              Generar Código QR
            </Button>
          )}
          {step === 'qr' && (
            <Button variant="outline" onClick={handleClose} className="rounded-xl font-bold h-12 px-8 w-full">
              Cancelar
            </Button>
          )}
          {step === 'success' && (
            <Button onClick={handleClose} className="rounded-xl font-bold h-12 px-12 w-full">
              Finalizar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};