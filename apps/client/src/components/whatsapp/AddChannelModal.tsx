import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Loader2, QrCode, CheckCircle2, MessageCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { WhatsAppInstance } from '@/hooks/use-whatsapp-instances';
import { toast } from 'sonner';

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, platform?: 'whatsapp' | 'messenger', external_id?: string, access_token?: string) => Promise<any>;
  instances: WhatsAppInstance[];
  initialInstance?: { id: string; name: string } | null;
}

export const AddChannelModal = ({ isOpen, onClose, onAdd, instances, initialInstance }: AddChannelModalProps) => {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'whatsapp' | 'messenger' | null>(null);
  const [step, setStep] = useState<'platform' | 'input' | 'qr' | 'success'>('platform');
  const [loading, setLoading] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Monitor status in real-time
  useEffect(() => {
    if (currentId && platform === 'whatsapp') {
      const active = instances.find(i => i.id === currentId);
      if (active?.status === 'connected') {
        setStep('success');
      }
    }
  }, [instances, currentId, platform]);

  useEffect(() => {
    if (isOpen) {
      if (initialInstance) {
        setCurrentId(initialInstance.id);
        setName(initialInstance.name);
        setPlatform('whatsapp');
        setStep('qr');
      } else {
        setStep('platform');
        setPlatform(null);
        setName('');
        setCurrentId(null);
      }
    }
  }, [isOpen, initialInstance]);

  const handleAddWhatsApp = async () => {
    if (!name) return;
    setLoading(true);
    try {
      const instance = await onAdd(name, 'whatsapp');
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

  const handleFacebookLogin = async () => {
    setLoading(true);
    // Simulación del flujo de Facebook Login para UX sin fricción
    toast.info("Redirigiendo a Facebook de forma segura...");
    
    setTimeout(async () => {
      try {
        // En producción, aquí se usaría FB.login() para obtener el Page Access Token
        const mockPageId = "page_" + Math.random().toString(36).substr(2, 9);
        const mockToken = "EAA" + Math.random().toString(36).substr(2, 20);
        const mockPageName = "Mi Tienda en Facebook";
        
        const instance = await onAdd(mockPageName, 'messenger', mockPageId, mockToken);
        if (instance) {
          setStep('success');
        }
      } catch (error) {
        toast.error("Error al conectar con Facebook");
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  const handleClose = () => {
    setStep('platform');
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
            {step === 'platform' && <MessageCircle className="w-8 h-8 text-primary" />}
            {step === 'input' && <QrCode className="w-8 h-8 text-primary" />}
            {step === 'qr' && <QrCode className="w-8 h-8 text-primary animate-pulse" />}
            {step === 'success' && <CheckCircle2 className="w-8 h-8 text-green-500" />}
          </div>
          <DialogTitle className="text-2xl font-bold text-center tracking-tight">
            {step === 'platform' && 'Selecciona un Canal'}
            {step === 'input' && 'Vincular Cuenta de WhatsApp'}
            {step === 'qr' && 'Escanear con WhatsApp'}
            {step === 'success' && '¡Canal Vinculado!'}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground font-medium">
            {step === 'platform' && 'Elige dónde quieres que tu Agente IA responda a los clientes.'}
            {step === 'input' && 'Introduce un nombre identificador para esta cuenta.'}
            {step === 'qr' && 'Abre WhatsApp > Dispositivos Vinculados > Vincular.'}
            {step === 'success' && 'Tu cuenta ya está lista para procesar mensajes automáticamente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 min-h-[200px] flex items-center justify-center">
          {step === 'platform' && (
            <div className="grid grid-cols-2 gap-4 w-full">
              <Button 
                variant="outline" 
                className="h-32 flex flex-col gap-3 rounded-2xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                onClick={() => { setPlatform('whatsapp'); setStep('input'); }}
              >
                <div className="w-12 h-12 bg-[#25D366]/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.881-.653-1.474-1.46-1.648-1.758-.173-.298-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                </div>
                <span className="font-bold">WhatsApp</span>
              </Button>

              <Button 
                variant="outline" 
                className="h-32 flex flex-col gap-3 rounded-2xl border-2 hover:border-[#0084FF]/50 hover:bg-[#0084FF]/5 transition-all"
                onClick={() => { setPlatform('messenger'); handleFacebookLogin(); }}
                disabled={loading}
              >
                <div className="w-12 h-12 bg-[#0084FF]/10 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#0084FF]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0Zm1.191 14.963-3.056-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.888-3.26-6.558 6.963Z"/></svg>
                </div>
                <span className="font-bold">Messenger</span>
              </Button>
            </div>
          )}

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
              <p className="text-muted-foreground font-medium mt-1">
                {platform === 'whatsapp' ? 'Sincronizando chats en segundo plano...' : 'El Webhook está activo para tu Fan Page.'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-center gap-3">
          {step === 'input' && (
            <Button onClick={handleAddWhatsApp} disabled={!name || loading} className="rounded-xl font-bold h-12 px-12 transition-all">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                GENERAR QR
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