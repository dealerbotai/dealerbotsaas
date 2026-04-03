import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp } from '@/hooks/use-whatsapp-instances';
import { ACL } from '@/lib/acl';
import { 
  Zap, 
  Shield, 
  Rocket, 
  CreditCard, 
  Activity, 
  Layers, 
  Store, 
  UserCircle2,
  ChevronRight,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import PricingSection from '@/components/ui/pricing-section';

const UsageProgress = ({ 
  label, 
  current, 
  limit, 
  icon: Icon 
}: { 
  label: string; 
  current: number; 
  limit: number; 
  icon: any 
}) => {
  const percentage = Math.min((current / limit) * 100, 100);
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-secondary/50 text-primary">
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-foreground/80">{label}</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-foreground">{current}</span>
          <span className="text-xs text-muted-foreground font-medium ml-1">/ {limit >= 999 ? '∞' : limit}</span>
        </div>
      </div>
      <div className="h-2.5 w-full bg-secondary/40 rounded-full overflow-hidden p-[2px]">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden",
            percentage > 90 ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default function Billing() {
  const { workspace, instances, agents, stores, usage, loading } = useWhatsApp();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  const currentPlan = workspace?.plan || 'free';
  const limits = ACL[currentPlan];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-12 pb-20 page-enter font-outfit">
        {/* Compact Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-1">
              <Shield className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-wider">Enterprise Billing</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">Gestión de Membresía</h1>
            <p className="text-muted-foreground text-sm font-medium">Controla tu infraestructura y escala tus capacidades de IA.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-card px-6 py-4 rounded-[2rem] border border-border/5 shadow-sm flex items-center gap-6">
                <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[2px] mb-1">Plan Actual</p>
                    <p className="text-base font-black text-primary uppercase tracking-tight">{currentPlan}</p>
                </div>
                <div className="w-[1px] h-8 bg-border/10" />
                <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[2px] mb-1">Estado Cuenta</p>
                    <p className="text-base font-black text-emerald-500 uppercase tracking-tight">{workspace?.subscription_status || 'Activa'}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
          {/* Resource Usage - Modernized */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-card p-10 rounded-[2.5rem] border border-border/5 shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase tracking-[3px] text-foreground">Consumo de Infraestructura</h3>
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold uppercase text-[9px]">Sincronizado</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                <UsageProgress 
                  label="Instancias" 
                  current={instances.length} 
                  limit={limits.maxInstances} 
                  icon={Zap} 
                />
                <UsageProgress 
                  label="Tiendas" 
                  current={stores.length} 
                  limit={limits.maxStores} 
                  icon={Store} 
                />
                <UsageProgress 
                  label="Agentes" 
                  current={agents.length} 
                  limit={limits.maxAgents} 
                  icon={UserCircle2} 
                />
                <UsageProgress 
                  label="Tokens AI" 
                  current={usage.tokens} 
                  limit={usage.limit} 
                  icon={Activity} 
                />
              </div>
            </div>

            <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6 text-center md:text-left">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-inner">
                        <CreditCard className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[2px] mb-1">Método de Facturación</p>
                        <p className="text-lg font-bold text-foreground tracking-tight">Stripe Secure Gateway •••• 4242</p>
                    </div>
                </div>
                <Button className="w-full md:w-auto bg-primary text-primary-foreground h-14 px-10 rounded-2xl font-black text-[11px] uppercase tracking-[2px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Gestionar Pagos <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
          </div>

          {/* Upgrade Card - Refined */}
          <div className="lg:col-span-4 bg-primary rounded-[2.5rem] p-10 text-primary-foreground relative overflow-hidden group shadow-2xl shadow-primary/20">
            <div className="absolute right-[-15%] bottom-[-10%] opacity-10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700">
              <Crown className="w-64 h-64" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">Escala tu <br /> Operación</h3>
                    <p className="text-sm font-medium text-primary-foreground/80 leading-relaxed">
                        Desbloquea el poder absoluto de Dealerbot. Recursos ilimitados, IA de última generación y soporte prioritario 24/7.
                    </p>
                </div>
              </div>
              <Button className="bg-white text-primary hover:bg-neutral-100 h-14 rounded-2xl font-black text-[11px] uppercase tracking-[2px] mt-10 w-full shadow-lg">
                Subir de Nivel
              </Button>
            </div>
          </div>
        </div>

        {/* New Pricing Section Integration */}
        <div className="pt-12 -mx-4">
          <PricingSection />
        </div>
      </div>
    </MainLayout>
  );
}
