import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { 
    MessageSquare, 
    Facebook, 
    CheckCircle2, 
    ArrowRight, 
    ArrowLeft,
    Loader2,
    QrCode,
    Shield,
    Globe,
    Cpu
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { sileo as toast } from 'sileo';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { socket } from '@/lib/socket';

const steps = [
  { id: 'platform', title: 'Plataforma', description: 'Selecciona el canal de comunicación' },
  { id: 'identity', title: 'Identidad', description: 'Define el nombre de tu instancia' },
  { id: 'connection', title: 'Conexión', description: 'Vincula tu cuenta' },
  { id: 'success', title: 'Finalizado', description: 'Tu agente está listo' }
];

const InstanceWizard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { instances, addInstance, startInstance } = useWhatsApp();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [platform, setPlatform] = useState<'whatsapp' | 'messenger' | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Handle initial params for reconnection
  useEffect(() => {
    const id = searchParams.get('id');
    const nameParam = searchParams.get('name');
    if (id && nameParam) {
      setCurrentId(id);
      setName(nameParam);
      setPlatform('whatsapp');
      setCurrentStep(2); // Jump directly to connection/QR
      startInstance(id, nameParam);
    }
  }, [searchParams, startInstance]);

  // Direct socket subscription for real-time updates within the wizard
  useEffect(() => {
    if (!currentId) return;

    // Join the specific room for this instance to receive events
    console.log('🔌 Joining socket room for instance:', currentId);
    socket.emit('register-instance', { instanceId: currentId });

    const handleReady = (data: { instanceId: string }) => {
      console.log('📩 Socket event [ready] received:', data);
      if (data.instanceId === currentId) {
        console.log('✅ Wizard detected instance ready:', currentId);
        setCurrentStep(3); // Success step
      }
    };

    const handleQR = (data: { instanceId: string, qr: string }) => {
      console.log('📩 Socket event [qr] received for:', data.instanceId);
    };

    socket.on('ready', handleReady);
    socket.on('qr', handleQR);
    
    return () => {
      socket.off('ready', handleReady);
      socket.off('qr', handleQR);
    };
  }, [currentId]);

  const activeStep = steps[currentStep];

  // Monitor WhatsApp connection status
  useEffect(() => {
    if (currentId && platform === 'whatsapp') {
      const active = instances.find(i => i.id === currentId);
      if (active?.status === 'connected') {
        setCurrentStep(3); // Success
      }
    }
  }, [instances, currentId, platform]);

  const handlePlatformSelect = (p: 'whatsapp' | 'messenger') => {
    setPlatform(p);
    setCurrentStep(1);
  };

  const handleCreateInstance = async () => {
    if (!name || !platform) return;
    setLoading(true);
    try {
      if (platform === 'whatsapp') {
        const instance = await addInstance(name, 'whatsapp');
        if (instance) {
          setCurrentId(instance.id);
          setCurrentStep(2); // Connection step (QR)
        }
      } else {
        // Messenger simulation as in original modal
        toast.info("Conectando con Facebook Business Manager...");
        setTimeout(async () => {
          const mockPageId = "page_" + Math.random().toString(36).substr(2, 9);
          const mockToken = "EAA" + Math.random().toString(36).substr(2, 20);
          const mockPageName = name || "Messenger Business";
          
          const instance = await addInstance(mockPageName, 'messenger', mockPageId, mockToken);
          if (instance) {
            setCurrentStep(3); // Success
          }
          setLoading(false);
        }, 1500);
      }
    } catch (error) {
      toast.error("Error al crear la instancia");
      setLoading(false);
    } finally {
      if (platform === 'whatsapp') setLoading(false);
    }
  };

  const currentInstance = instances.find(i => i.id === currentId);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex flex-col items-center flex-1 relative">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 z-10",
                  currentStep >= idx ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-secondary text-muted-foreground"
                )}>
                  {currentStep > idx ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={cn(
                  "mt-3 text-[10px] font-black uppercase tracking-widest text-center",
                  currentStep >= idx ? "text-primary" : "text-muted-foreground/40"
                )}>
                  {s.title}
                </span>
                {idx < steps.length - 1 && (
                  <div className={cn(
                    "absolute top-5 left-1/2 w-full h-[2px] -z-0 transition-all duration-500",
                    currentStep > idx ? "bg-primary" : "bg-secondary"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-[40px] shadow-sm border border-border/5 p-8 md:p-16 min-h-[500px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">{activeStep.title}</h2>
                <p className="text-muted-foreground font-medium">{activeStep.description}</p>
              </div>

              {/* Step: Platform */}
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
                  <button
                    onClick={() => handlePlatformSelect('whatsapp')}
                    className="group relative bg-secondary/30 hover:bg-primary/5 border-2 border-transparent hover:border-primary/50 p-8 rounded-[32px] transition-all duration-500 text-left"
                  >
                    <div className="w-16 h-16 bg-[#25D366]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-8 h-8 text-[#25D366]" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">WhatsApp Business</h3>
                    <p className="text-sm text-muted-foreground font-medium mb-4">Conecta tu número de empresa mediante código QR.</p>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                      Seleccionar <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>

                  <button
                    onClick={() => handlePlatformSelect('messenger')}
                    className="group relative bg-secondary/30 hover:bg-[#0084FF]/5 border-2 border-transparent hover:border-[#0084FF]/50 p-8 rounded-[32px] transition-all duration-500 text-left"
                  >
                    <div className="w-16 h-16 bg-[#0084FF]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Facebook className="w-8 h-8 text-[#0084FF]" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Facebook Messenger</h3>
                    <p className="text-sm text-muted-foreground font-medium mb-4">Vincula tus Fan Pages de Facebook directamente.</p>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#0084FF]">
                      Seleccionar <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                </div>
              )}

              {/* Step: Identity */}
              {currentStep === 1 && (
                <div className="max-w-md mx-auto w-full space-y-8 py-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground">Nombre de la Instancia</Label>
                    <Input
                      placeholder="Ej: Ventas Corporativas"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-16 rounded-2xl border-none bg-secondary/50 text-lg font-bold px-6 focus:ring-2 focus:ring-primary/20 transition-all"
                      autoFocus
                    />
                  </div>
                  
                  <div className="bg-secondary/20 p-6 rounded-2xl border border-border/5 space-y-4">
                    <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Seguridad Garantizada</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Tu instancia estará aislada en un contenedor seguro. Los datos de sesión se cifran localmente.
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button 
                      variant="secondary" 
                      onClick={() => setCurrentStep(0)}
                      className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                    >
                      Atrás
                    </Button>
                    <Button 
                      disabled={!name || loading} 
                      onClick={handleCreateInstance}
                      className="flex-[2] h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      {platform === 'whatsapp' ? 'Generar QR' : 'Vincular Facebook'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Connection (QR) */}
              {currentStep === 2 && (
                <div className="max-w-xl mx-auto w-full flex flex-col items-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Globe className="w-4 h-4 text-primary" /> Instrucciones
                            </h4>
                            <ol className="space-y-4 text-sm font-medium text-muted-foreground list-decimal list-inside">
                                <li>Abre WhatsApp en tu teléfono</li>
                                <li>Toca en <span className="text-foreground font-bold">Configuración</span></li>
                                <li>Selecciona <span className="text-foreground font-bold">Dispositivos Vinculados</span></li>
                                <li>Escanea el código QR de la derecha</li>
                            </ol>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <p className="text-[10px] font-bold text-primary leading-relaxed">
                                Si el código no carga, refresca la página para generar uno nuevo.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <div className="p-6 bg-white rounded-[40px] shadow-2xl border-4 border-primary/5 relative overflow-hidden">
                            {currentInstance?.qr ? (
                              <QRCodeSVG value={currentInstance.qr} size={240} includeMargin />
                            ) : (
                              <div className="w-[240px] h-[240px] flex flex-col items-center justify-center gap-4 bg-secondary/50 rounded-3xl">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Iniciando Motor...</span>
                              </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Esperando escaneo...</span>
                        </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 w-full pt-8 border-t border-border/5">
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate('/instances')}
                      className="w-full h-12 rounded-xl font-bold text-muted-foreground hover:text-foreground"
                    >
                      Cancelar proceso
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Success */}
              {currentStep === 3 && (
                <div className="max-w-md mx-auto w-full flex flex-col items-center text-center py-12">
                  <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-primary/40">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter uppercase mb-4">¡Instancia Activa!</h2>
                  <p className="text-lg text-muted-foreground font-medium mb-12">
                    Tu canal de {platform === 'whatsapp' ? 'WhatsApp' : 'Messenger'} ha sido vinculado correctamente y está listo para operar.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <Button 
                      variant="secondary"
                      onClick={() => navigate('/instances')}
                      className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                    >
                      Ir a Instancias
                    </Button>
                    <Button 
                      onClick={() => navigate(`/instances/${currentId || ''}`)}
                      className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                    >
                      Configurar Agent IA <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
};

// Simple Plus icon helper since it wasn't imported from lucide
const Plus = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
);

export default InstanceWizard;
