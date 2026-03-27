import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { WhatsAppConnector } from './WhatsAppConnector';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLinking?: (name: string) => void; // Maintained for backwards compatibility
  socket: Socket | null;
  onSuccess: () => void;
  instanceId?: string;
}

export const QRCodeModal = ({ isOpen, onClose, socket, onSuccess, instanceId }: QRCodeModalProps) => {
  const [name, setName] = useState('');
  const [step, setStep] = useState<'input' | 'connector'>('input');
  
  useEffect(() => {
    if (isOpen) {
      if (instanceId) {
        setStep('connector');
      } else {
        setStep('input');
        setName('');
      }
    }
  }, [isOpen, instanceId]);

  const handleStart = () => {
    if (!name) return;
    setStep('connector');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setStep('input');
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[450px] p-0 bg-transparent border-none shadow-none">
        
        {step === 'input' && (
          <div className="p-8 border rounded-[1.5rem] shadow-2xl bg-[#0d0e12] border-white/5 w-full mx-auto relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />
             <h3 className="text-lg font-bold mb-6 text-white uppercase tracking-widest text-center">Nueva Instancia</h3>
             <div className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-gray-500">Nombre de la Instancia</Label>
                  <Input
                    id="name"
                    placeholder="ej. Ventas México"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-14 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-gray-700 font-bold focus-visible:ring-amber-500/50"
                  />
                </div>
                <Button 
                  onClick={handleStart} 
                  disabled={!name} 
                  className="w-full h-12 rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.1)] hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:hover:shadow-none"
                >
                  Continuar a Vinculación
                </Button>
             </div>
          </div>
        )}

        {step === 'connector' && (
          <WhatsAppConnector 
            socket={socket} 
            instanceId={instanceId} 
            instanceName={name}
            onSuccess={() => {
              onSuccess();
              setTimeout(() => {
                onClose();
                setStep('input');
              }, 2000);
            }} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
};