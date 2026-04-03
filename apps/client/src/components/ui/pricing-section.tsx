"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { 
  Check, 
  Zap, 
  ShieldCheck, 
  MessageSquare, 
  Store, 
  Users, 
  Bot,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Gratis",
    description: "Prueba el potencial de la IA sin costo.",
    price: 0,
    yearlyPrice: 0,
    buttonText: "Empezar Gratis",
    buttonVariant: "outline" as const,
    features: [
      { text: "1 Instancia de WhatsApp", icon: <MessageSquare size={18} /> },
      { text: "1 Tienda", icon: <Store size={18} /> },
    ],
    includes: [
      "Respuestas automáticas simples",
      "Soporte por comunidad",
    ],
  },
  {
    name: "Starter",
    description: "Pequeños negocios que automatizan su atención.",
    price: 49,
    yearlyPrice: 470,
    buttonText: "Elegir Starter",
    buttonVariant: "default" as const,
    popular: true,
    accentColor: "bg-green-500",
    features: [
      { text: "1 Instancia de WhatsApp", icon: <MessageSquare size={18} /> },
      { text: "1 Instancia de Messenger", icon: <Zap size={18} /> },
      { text: "2 Tiendas", icon: <Store size={18} /> },
      { text: "4 Agentes humanos", icon: <Users size={18} /> },
    ],
    includes: [
      "Primera Semana Gratis",
      "Integración CRM Básica",
      "Soporte por Email",
    ],
  },
  {
    name: "Pro",
    description: "Empresas en crecimiento con IA avanzada.",
    price: 149,
    yearlyPrice: 1430,
    buttonText: "Elegir Pro",
    buttonVariant: "black" as const,
    features: [
      { text: "10 WhatsApp / 5 Messenger", icon: <MessageSquare size={18} /> },
      { text: "10 Instagram", icon: <Sparkles size={18} /> },
      { text: "Tiendas Ilimitadas", icon: <Store size={18} /> },
      { text: "Agentes Ilimitados", icon: <Users size={18} /> },
    ],
    includes: [
      "Todo en Starter, más:",
      "IA Avanzada (GPT-4 optimizado)",
      "Soporte 24/7 Prioritario",
      "White Labeling",
    ],
  },
];

const PricingSwitch = ({ onSwitch }: { onSwitch: (value: boolean) => void }) => {
  const [isYearly, setIsYearly] = useState(false);

  const handleToggle = (val: boolean) => {
    setIsYearly(val);
    onSwitch(val);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex p-1 bg-secondary/50 rounded-2xl border border-border/50 w-fit">
        <motion.div
          className="absolute inset-y-1 bg-white rounded-xl shadow-sm border border-border/50"
          initial={false}
          animate={{
            x: isYearly ? "100%" : "0%",
            width: "calc(50% - 4px)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <button
          onClick={() => handleToggle(false)}
          className={cn(
            "relative z-10 px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-colors",
            !isYearly ? "text-primary" : "text-muted-foreground"
          )}
        >
          Mensual
        </button>
        <button
          onClick={() => handleToggle(true)}
          className={cn(
            "relative z-10 px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-colors",
            isYearly ? "text-primary" : "text-muted-foreground"
          )}
        >
          Anual
        </button>
      </div>
      <div className="flex items-center gap-2">
         <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
            Ahorra hasta 20%
         </span>
      </div>
    </div>
  );
};

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="py-24 px-4 bg-background font-outfit relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-[11px] font-black text-green-500 uppercase tracking-[4px]">Estructura de Inversión</h2>
          <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase leading-none">
            Planes de <span className="text-green-500 italic">Crecimiento.</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-2xl mx-auto text-sm md:text-base">
            Selecciona la infraestructura de IA que mejor se adapte a la escala de tu concesionaria o negocio automotriz.
          </p>
          
          <div className="pt-8">
            <PricingSwitch onSwitch={setIsYearly} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className={cn(
                "h-full rounded-[2.5rem] border border-border/50 bg-white flex flex-col transition-all duration-500 overflow-hidden relative group",
                plan.popular ? "shadow-2xl shadow-green-500/10 scale-105 border-green-500/20 z-20" : "shadow-sm hover:shadow-xl"
              )}>
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-green-500 text-white text-[9px] font-black uppercase tracking-widest py-1.5 px-6 rounded-bl-2xl shadow-lg">
                      Más Popular
                    </div>
                  </div>
                )}

                <CardHeader className="p-8 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">{plan.name}</h3>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">{plan.description}</p>
                  </div>
                  
                  <div className="pt-6 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-foreground">$</span>
                    <NumberFlow 
                        value={isYearly ? plan.yearlyPrice : plan.price} 
                        className="text-6xl font-black text-foreground tracking-tighter"
                    />
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest ml-1">
                      {plan.price === 0 ? "" : (isYearly ? "/año" : "/mes")}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-8 pt-4 space-y-8 flex-1 flex flex-col">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Capacidad</p>
                    <div className="space-y-3">
                      {plan.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-3 text-sm font-bold text-foreground group-hover:translate-x-1 transition-transform">
                          <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-primary transition-colors group-hover:bg-green-500 group-hover:text-white">
                            {feature.icon}
                          </div>
                          <span className="tracking-tight">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Incluye</p>
                    <div className="space-y-2.5">
                      {plan.includes.map((inc, iIdx) => (
                        <div key={iIdx} className="flex items-start gap-3 text-[13px] font-medium text-muted-foreground leading-tight">
                          <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-8">
                    <Button 
                      className={cn(
                        "w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[2px] gap-3 transition-all group/btn shadow-md",
                        plan.buttonVariant === "default" && plan.name === "Starter" ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20" : 
                        plan.buttonVariant === "default" || plan.buttonVariant === "black" ? "bg-black hover:bg-neutral-800 text-white shadow-black/20" :
                        "bg-transparent border-2 border-black text-black hover:bg-black hover:text-white"
                      )}
                    >
                      {plan.buttonText}
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-4 p-4 rounded-3xl bg-secondary/30 border border-border/50">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-left max-w-xs">
                    Todas las transacciones están cifradas y procesadas de forma segura. <span className="text-foreground">Soporte empresarial incluido.</span>
                </p>
            </div>
        </div>
      </div>
    </section>
  );
}
