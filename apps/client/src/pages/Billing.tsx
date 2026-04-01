import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useWhatsApp, PLAN_LIMITS } from '@/hooks/use-whatsapp-instances';
import { 
  Check, 
  Zap, 
  Shield, 
  Rocket, 
  CreditCard, 
  Activity, 
  Layers, 
  Store, 
  UserCircle2,
  ChevronRight,
  Star,
  Trophy,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PricingTier = ({ 
  title, 
  price, 
  description, 
  features, 
  icon: Icon, 
  isCurrent, 
  isPopular,
  buttonText 
}: { 
  title: string; 
  price: string; 
  description: string; 
  features: string[]; 
  icon: any; 
  isCurrent?: boolean; 
  isPopular?: boolean;
  buttonText?: string;
}) => (
  <div className={cn(
    "premium-card flex flex-col relative overflow-hidden group transition-all duration-500",
    isCurrent && "shadow-xl shadow-primary/10 ring-1 ring-primary/20",
    isPopular && "scale-105 z-10 shadow-2xl shadow-primary/10"
  )}>
    {isPopular && (
      <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl">
        Recomendado
      </div>
    )}
    
    <div className="flex items-start justify-between mb-6">
      <div className={cn(
        "p-3 rounded-2xl",
        isCurrent ? "bg-primary/10 text-primary" : "bg-secondary/50 text-muted-foreground"
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-right">
        <h3 className="text-xl font-bold text-foreground tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-xs font-medium">{description}</p>
      </div>
    </div>

    <div className="mb-8">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black text-foreground tracking-tighter">{price}</span>
        {price !== 'Custom' && price !== '$0' && <span className="text-muted-foreground text-sm font-bold">/mes</span>}
      </div>
    </div>

    <div className="space-y-4 mb-10 flex-1">
      {features.map((feature, i) => (
        <div key={i} className="flex items-center gap-3 group/item">
          <div className="p-1 rounded-full bg-primary/10 text-primary group-hover/item:scale-110 transition-transform">
            <Check className="w-3 h-3" />
          </div>
          <span className="text-sm text-foreground/80 font-medium">{feature}</span>
        </div>
      ))}
    </div>

    <Button 
      className={cn(
        "w-full h-12 rounded-2xl font-bold transition-all duration-300",
        isCurrent 
          ? "bg-secondary text-foreground hover:bg-secondary/80" 
          : isPopular
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
            : "bg-background hover:bg-secondary/50 shadow-sm"
      )}
    >
      {isCurrent ? 'Plan Actual' : (buttonText || 'Mejorar Plan')}
    </Button>
  </div>
);

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
          <span className="text-xs text-muted-foreground font-medium ml-1">/ {limit === 999 ? '∞' : limit}</span>
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
  const limits = PLAN_LIMITS[currentPlan];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-12 pb-20 page-enter">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary mb-2 glow-primary">
            <Shield className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-wider">Facturación Segura</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter gradient-text">
            Planes y Membresía
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl font-medium leading-relaxed">
            Gestiona tu suscripción, revisa tu consumo de recursos y descubre nuevas funcionalidades para potenciar tu negocio.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Plan Summary */}
          <div className="lg:col-span-2 space-y-8">
            <div className="premium-card bg-gradient-to-br from-card to-secondary/30 relative overflow-hidden group shadow-lg">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[2px] text-primary">Suscripción Activa</p>
                    <div className="flex items-center gap-4">
                      <h2 className="text-3xl font-black text-foreground capitalize">
                        Plan {currentPlan}
                      </h2>
                      <div className="px-3 py-1 rounded-lg bg-primary/30 text-primary flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        <span className="text-[11px] font-black">Activo</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Siguiente Cobro</p>
                      <div className="flex items-center gap-2 text-foreground font-bold">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <span>15 de Oct, 2023</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60">Método de Pago</p>
                      <div className="flex items-center gap-2 text-foreground font-bold">
                        <div className="w-6 h-4 bg-foreground/10 rounded-sm" />
                        <span>•••• 4242</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button className="bg-primary text-primary-foreground h-12 px-8 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex gap-2">
                    Gestionar Suscripción <ChevronRight className="w-4 h-4" />
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground font-medium opacity-60 hover:opacity-100 transition-opacity">
                    Procesado de forma segura por Stripe
                  </p>
                </div>
              </div>
            </div>

            {/* Resource Usage */}
            <div className="premium-card space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-foreground">Uso de Recursos</h3>
                  <p className="text-xs text-muted-foreground font-medium">Controla el consumo de tu plan actual</p>
                </div>
                <div className="p-3 rounded-2xl bg-secondary/50 text-muted-foreground">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <UsageProgress 
                  label="Instancias" 
                  current={instances.length} 
                  limit={limits.instances} 
                  icon={Zap} 
                />
                <UsageProgress 
                  label="Tiendas" 
                  current={stores.length} 
                  limit={limits.stores} 
                  icon={Store} 
                />
                <UsageProgress 
                  label="Agentes IA" 
                  current={agents.length} 
                  limit={limits.agents} 
                  icon={UserCircle2} 
                />
                <UsageProgress 
                  label="Tokens IA" 
                  current={usage.tokens} 
                  limit={usage.limit} 
                  icon={Activity} 
                />
              </div>
            </div>
          </div>

          {/* Featured Perk/Incentive */}
          <div className="premium-card bg-primary text-primary-foreground flex flex-col justify-between overflow-hidden relative">
            <div className="absolute right-[-20%] bottom-[-10%] opacity-20 rotate-12">
              <Rocket className="w-64 h-64" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="p-3 rounded-2xl bg-white/10 w-fit">
                <Crown className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black leading-tight">¿Necesitas más potencia?</h3>
                <p className="text-primary-foreground/80 text-sm font-medium leading-relaxed">
                  Desbloquea integraciones avanzadas, soporte prioritario y recursos ilimitados con el plan Enterprise.
                </p>
              </div>
            </div>

            <Button className="relative z-10 bg-white text-primary hover:bg-white/90 h-12 rounded-2xl font-black text-xs uppercase tracking-widest mt-8">
              Contactar Ventas
            </Button>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="space-y-10 pt-10">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-foreground tracking-tighter">Escala tu negocio</h2>
            <p className="text-muted-foreground font-medium">Elige el plan que mejor se adapte a tus necesidades de crecimiento.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingTier 
              title="Gratis"
              price="$0"
              description="Ideal para comenzar"
              icon={Star}
              isCurrent={currentPlan === 'free'}
              features={[
                '1 Instancia de WhatsApp',
                '1 Tienda E-commerce',
                '1 Agente IA especializado',
                'Integración básica con Groq',
                'Soporte por Comunidad'
              ]}
            />
            <PricingTier 
              title="Pro"
              price="$29"
              description="Para negocios en crecimiento"
              icon={Trophy}
              isPopular={true}
              isCurrent={currentPlan === 'pro'}
              features={[
                '5 Instancias de WhatsApp',
                '10 Tiendas E-commerce',
                '20 Agentes IA',
                'Soporte Prioritario 24/7',
                'Reportes avanzados de ventas',
                'Modelos IA personalizados'
              ]}
            />
            <PricingTier 
              title="Enterprise"
              price="Custom"
              description="Potencia sin límites"
              icon={Crown}
              isCurrent={currentPlan === 'enterprise'}
              buttonText="Hablar con Ventas"
              features={[
                'Recursos Ilimitados',
                'Account Manager Dedicado',
                'Acceso a API de desarrollador',
                'SLA garantizado 99.9%',
                'Infraestructura aislada',
                'Onboarding personalizado'
              ]}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
